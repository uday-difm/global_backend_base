import prisma from "@/lib/prisma";
import { BaseService } from "@/core/service";
import { NotFoundError } from "@/core/errors";

export class SeoService extends BaseService {
  constructor() {
    super({ modelName: "globalSettings" });
  }

  async getSitemapItems(siteId) {
    const pages = await prisma.page.findMany({
      where: { siteId, status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const posts = await prisma.post.findMany({
      where: {
        siteId,
        status: "PUBLISHED",
        deletedAt: null,
        publishedAt: { lte: new Date() },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const legalPages = await prisma.legalPage.findMany({
      where: { siteId, deletedAt: null },
      select: { type: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    // Universal: exclude Next.js dynamic route patterns like [slug], [...catchall], [[optional]]
    const DYNAMIC_SEGMENT = /\[.*?\]/;
    const isInfinium = siteId === "infinium";
    const postPrefix = isInfinium ? "/posts" : "/blogs";

    const items = [
      ...pages
        .filter((p) => !DYNAMIC_SEGMENT.test(p.slug))
        .map((p) => ({
          url: p.slug.startsWith("/") ? p.slug : `/${p.slug}`,
          lastModified: p.updatedAt.toISOString(),
        })),
      ...posts.map((p) => ({
        url: `${postPrefix}/${p.slug}`,
        lastModified: p.updatedAt.toISOString(),
      })),
      ...legalPages
        .filter((lp) => !DYNAMIC_SEGMENT.test(lp.type))
        .map((lp) => {
          let typeSlug = lp.type;
          if (isInfinium) {
            if (lp.type === "privacy") typeSlug = "privacy-policy";
            else if (lp.type === "terms") typeSlug = "terms-of-use";
            else if (lp.type === "cookies") typeSlug = "cookie-policy";
          }
          return {
            url: `/legal/${typeSlug}`,
            lastModified: lp.updatedAt.toISOString(),
          };
        }),
    ];

    return items;
  }

  async getRobotsTxt(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { websiteSettings: true },
    });

    if (settings?.websiteSettings?.robotsTxt) {
      return settings.websiteSettings.robotsTxt;
    }

    const domain = settings?.websiteSettings?.domain || `http://localhost:3000`;

    return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: ${domain}/sitemap.xml
`;
  }

  async getLlmTxt(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { websiteSettings: true },
    });

    if (settings?.websiteSettings?.llmTxt) {
      return settings.websiteSettings.llmTxt;
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        services: {
          where: { status: "ACTIVE" },
          select: { title: true, description: true },
        },
        posts: {
          where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
          select: { title: true, excerpt: true },
        },
      },
    });

    if (!site) {
      throw new NotFoundError("Site");
    }

    let text = `# ${site.name} - AI Agent Guide\n\n`;
    text += `This document provides indexable information on the services, posts, and structure of ${site.name} for AI and LLM agents.\n\n`;

    text += `## Core Offerings & Services\n`;
    site.services.forEach((s) => {
      text += `- **${s.title}**: ${s.description || "No description"}\n`;
    });
    text += `\n`;

    text += `## Latest Blog Posts\n`;
    site.posts.forEach((p) => {
      text += `- **${p.title}**: ${p.excerpt || "Read full article"}\n`;
    });

    return text;
  }
}

export const seoService = new SeoService();
