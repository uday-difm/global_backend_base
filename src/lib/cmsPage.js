import { pageService } from "@/services/page.service";
import prisma from "@/lib/prisma";

/**
 * Resolves a CMS page directly via Database queries instead of making loopback HTTP requests.
 * 
 * @param {string} slug - Page path slug
 * @param {boolean} preview - If true, bypasses status: "PUBLISHED" visibility check
 */
export async function getCmsPage(slug, preview = false) {
  const siteId = process.env.NEXT_PUBLIC_SITE_ID || "infinium";
  try {
    const page = await pageService.getPageWithSections(siteId, slug);
    if (!page) return null;

    if (!preview && page.status !== "PUBLISHED") {
      return null;
    }

    // Only render sections that are explicitly visible (default true when field absent)
    const visibleSections = page.sections.filter((s) => s.isVisible !== false);

    // Resolve referenced media ids -> URLs in content
    const mediaIds = new Set();
    visibleSections.forEach((s) => {
      const c = s.content || {};
      if (c.bannerMediaId) mediaIds.add(c.bannerMediaId);
      if (c.imageMediaId) mediaIds.add(c.imageMediaId);
    });

    let mediaMap = {};
    if (mediaIds.size > 0) {
      const mediaRows = await prisma.media.findMany({
        where: { id: { in: Array.from(mediaIds) } },
        select: { id: true, secureUrl: true, url: true, altText: true },
      });
      mediaMap = mediaRows.reduce((acc, m) => {
        acc[m.id] = m.secureUrl || m.url || null;
        return acc;
      }, {});
    }

    const sectionsWithUrls = await Promise.all(
      visibleSections.map(async (s) => {
        const content = { ...(s.content || {}) };
        if (content.bannerMediaId && mediaMap[content.bannerMediaId]) {
          content.bannerUrl = mediaMap[content.bannerMediaId];
        }
        if (content.imageMediaId && mediaMap[content.imageMediaId]) {
          content.imageUrl = mediaMap[content.imageMediaId];
        }

        // Dynamically fetch items for component-specific lists
        const type = String(s.type || "").toUpperCase();
        if (type === "SERVICES") {
          const services = await prisma.service.findMany({
            where: { siteId, status: "ACTIVE", deletedAt: null },
            orderBy: { sortOrder: "asc" },
          });
          content.items = services.map((srv) => {
            if (srv.price) {
              const trimmed = String(srv.price).trim();
              const isNumeric = !isNaN(trimmed) && !isNaN(parseFloat(trimmed));
              const hasCurrencySymbol = /[\$\€\£\¥\₹]/.test(trimmed);
              if (isNumeric && !hasCurrencySymbol) {
                return { ...srv, price: `$${trimmed}` };
              }
            }
            return srv;
          });
        } else if (type === "TEAM") {
          content.items = await prisma.teamMember.findMany({
            where: { siteId, deletedAt: null },
            orderBy: { sortOrder: "asc" },
          });
        } else if (type === "TESTIMONIALS") {
          content.items = await prisma.testimonial.findMany({
            where: { siteId, showHide: true, deletedAt: null },
            orderBy: { sortOrder: "asc" },
          });
        } else if (type === "FAQ") {
          content.items = await prisma.faq.findMany({
            where: {
              siteId,
              showHide: true,
              deletedAt: null,
              OR: [{ pageId: null }, { pageId: page.id }],
            },
            orderBy: { sortOrder: "asc" },
          });
        } else if (type === "BLOGS") {
          const postsRes = await prisma.post.findMany({
            where: {
              siteId,
              status: "PUBLISHED",
              deletedAt: null,
              publishedAt: { lte: new Date() },
            },
            orderBy: { publishedAt: "desc" },
            take: content.maxItems || 6,
            include: {
              author: { select: { id: true, email: true } },
              categories: { select: { id: true, name: true, slug: true } },
              featuredImage: {
                select: { id: true, url: true, secureUrl: true, altText: true },
              },
            },
          });
          content.items = postsRes;
        }

        return { ...s, content };
      }),
    );

    const seo = {
      title: page.seoTitle || page.title,
      description: page.seoDescription || null,
      canonical: page.canonicalUrl || null,
      ogImage: page.ogImage || null,
    };

    const { sections, ...pageData } = page;

    return {
      page: pageData,
      sections: sectionsWithUrls,
      seo,
      jsonLd: page.jsonLd ?? null,
    };
  } catch (error) {
    console.error(`Error resolving CMS page directly for slug ${slug}:`, error);
    return null;
  }
}
