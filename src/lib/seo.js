import prisma from "@/lib/prisma";

/**
 * Fetches SEO metadata from the DB directly for a given page/post slug.
 * Returns null if not found.
 * 
 * @param {string} pageSlug - The path slug of the page or post (e.g. '/' or '/about' or 'posts/some-post')
 */
export async function getSeoMetadata(pageSlug) {
  try {
    const siteId = process.env.NEXT_PUBLIC_SITE_ID || "infinium";
    let decodedSlug = pageSlug;
    if (decodedSlug === "home" || decodedSlug === "root" || decodedSlug === "") {
      decodedSlug = "/";
    }
    // Standardize slug format (prefixed with /)
    const formattedSlug = decodedSlug.startsWith("/") ? decodedSlug : `/${decodedSlug}`;

    const slugWithSlash = formattedSlug;
    const slugWithoutSlash = formattedSlug.startsWith("/") ? formattedSlug.substring(1) : formattedSlug;

    // 1. Try to find a Page
    const page = await prisma.page.findFirst({
      where: {
        siteId,
        slug: { in: [slugWithSlash, slugWithoutSlash] },
        deletedAt: null
      },
      select: { title: true, seoTitle: true, seoDescription: true, canonicalUrl: true, ogImage: true, jsonLd: true }
    });

    if (page) {
      return {
        title: page.seoTitle || page.title,
        description: page.seoDescription || null,
        canonical: page.canonicalUrl || `${process.env.NEXT_PUBLIC_APP_URL || ""}${formattedSlug}`,
        ogImage: page.ogImage || null,
        jsonLd: page.jsonLd
      };
    }

    // 2. Try to find a Legal Page
    if (formattedSlug.startsWith("/legal/")) {
      const legalType = formattedSlug.split("/")[2];
      const mapping = {
        "privacy": "privacy",
        "privacy-policy": "privacy",
        "terms": "terms",
        "terms-of-service": "terms",
        "terms-of-use": "terms",
        "cookies": "cookies",
        "cookie-policy": "cookies",
        "disclaimer": "disclaimer",
        "refund": "refund",
        "refund-policy": "refund"
      };
      const cleanType = mapping[legalType] || legalType;

      const legalPage = await prisma.legalPage.findFirst({
        where: {
          siteId,
          type: cleanType,
          deletedAt: null
        },
        select: { title: true, seoTitle: true, seoDescription: true }
      });

      if (legalPage) {
        return {
          title: legalPage.seoTitle || legalPage.title,
          description: legalPage.seoDescription || null,
          canonical: `${process.env.NEXT_PUBLIC_APP_URL || ""}${formattedSlug}`,
          ogImage: null
        };
      }
    }

    // 3. Try to find a Post
    const cleanPostSlug = slugWithoutSlash.startsWith("posts/") ? slugWithoutSlash.substring(6) : slugWithoutSlash;
    const post = await prisma.post.findFirst({
      where: {
        siteId,
        slug: cleanPostSlug,
        status: "PUBLISHED",
        deletedAt: null
      },
      select: { title: true, seoTitle: true, seoDescription: true, featuredImage: { select: { url: true } } }
    });

    if (post) {
      return {
        title: post.seoTitle || post.title,
        description: post.seoDescription || null,
        canonical: `${process.env.NEXT_PUBLIC_APP_URL || ""}/posts/${post.slug}`,
        ogImage: post.featuredImage?.url || null
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching SEO metadata directly for ${pageSlug}:`, error);
    return null;
  }
}
