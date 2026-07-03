import { pageRepository } from "@/repositories/page.repository";
import { sectionRepository } from "@/repositories/section.repository";
import { BaseService } from "@/core/service";
import { NotFoundError, ValidationError } from "@/core/errors";
import { versionService } from "@/services/version.service";

const RESERVED_SLUGS = [
  // Next.js standard/special routes
  "api",
  "login",
  "preview",
  "_next",
  "favicon.ico",
  "sitemap.xml",
  "robots.txt",
  "index",
  "home",
  // Admin dashboard routes
  "backup",
  "blogs",
  "compliance",
  "cta",
  "dashboard",
  "dev",
  "email",
  "faq",
  "footer",
  "header",
  "leads",
  "legal",
  "media",
  "navigation",
  "notifications",
  "pages",
  "performance",
  "redirects",
  "security",
  "services",
  "settings",
  "team",
  "testimonials",
  "users",
  "visitors",
];

export class PageService extends BaseService {
  constructor() {
    super(pageRepository);
  }

  async getPageWithSections(siteId, slug) {
    const page = await pageRepository.findBySlug(siteId, slug);
    if (!page) {
      throw new NotFoundError("Page");
    }
    return page;
  }

  async addSection(siteId, pageId, sectionData) {
    const page = await pageRepository.findUnique(siteId, pageId);
    if (!page) {
      throw new NotFoundError("Page");
    }

    const { type, content, name, order } = sectionData;
    if (!type || !content) {
      throw new ValidationError("Section type and content are required");
    }

    let sectionOrder = order;
    if (sectionOrder === undefined) {
      const sections = await sectionRepository.findMany(siteId, {
        where: { pageId, isDeleted: false },
        orderBy: { order: "desc" },
        take: 1,
      });
      sectionOrder = sections.length > 0 ? sections[0].order + 1 : 0;
    }

    return sectionRepository.create(siteId, {
      pageId,
      type,
      content,
      name: name || `${type} Section`,
      order: sectionOrder,
    });
  }

  async updateSection(siteId, sectionId, sectionData) {
    const section = await sectionRepository.findUnique(siteId, sectionId);
    if (!section || section.isDeleted) {
      throw new NotFoundError("Section");
    }

    const updateData = {};
    if (sectionData.content !== undefined)
      updateData.content = sectionData.content;
    if (sectionData.name !== undefined) updateData.name = sectionData.name;
    if (sectionData.isVisible !== undefined)
      updateData.isVisible = sectionData.isVisible;

    return sectionRepository.update(siteId, sectionId, updateData);
  }

  async reorderSections(siteId, pageId, orderedSectionIds) {
    const page = await pageRepository.findUnique(siteId, pageId);
    if (!page) {
      throw new NotFoundError("Page");
    }

    const updates = orderedSectionIds.map((id, index) => {
      return sectionRepository.update(siteId, id, { order: index });
    });

    await Promise.all(updates);
    return { success: true };
  }

  async deleteSection(siteId, sectionId) {
    const section = await sectionRepository.findUnique(siteId, sectionId);
    if (!section || section.isDeleted) {
      throw new NotFoundError("Section");
    }

    return sectionRepository.update(siteId, sectionId, { isDeleted: true });
  }

  async publishPage(siteId, pageId, isPublished) {
    const page = await pageRepository.findUnique(siteId, pageId);
    if (!page) {
      throw new NotFoundError("Page");
    }

    return pageRepository.update(siteId, pageId, {
      status: isPublished ? "PUBLISHED" : "DRAFT",
      publishedAt: isPublished ? new Date() : null,
    });
  }

  async update(siteId, id, data, userId = null, options = {}) {
    const current = await this.repository.findUnique(siteId, id);
    if (!current) {
      throw new NotFoundError("Page");
    }

    const updateData = { ...data };

    if (data.slug) {
      const cleanSlug = this.slugify(data.slug);
      if (RESERVED_SLUGS.includes(cleanSlug.toLowerCase())) {
        throw new ValidationError(
          `The slug "${data.slug}" is reserved for system use.`,
        );
      }

      // Check if slug is used by another page in this site
      const existing = await pageRepository.findFirst(siteId, {
        where: {
          slug: { in: [cleanSlug, `/${cleanSlug}`] },
          id: { not: id },
        },
      });
      if (existing) {
        throw new ValidationError(
          `The slug "${data.slug}" is already in use by another page.`,
        );
      }
      updateData.slug = cleanSlug;
    }

    if (data.status === "PUBLISHED" && current.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
      updateData.publishedBy = userId;
    } else if (data.status === "DRAFT" && current.status !== "DRAFT") {
      updateData.publishedAt = null;
      updateData.publishedBy = null;
    }
    const updated = await super.update(siteId, id, updateData, userId, options);

    // Save version snapshot
    try {
      await versionService.save(siteId, "PAGE", id, updated, userId);
    } catch (err) {
      console.error("Failed to save page version:", err);
    }

    return updated;
  }

  async create(siteId, data, userId = null, options = {}) {
    const baseSlug =
      (data.slug && this.slugify(data.slug)) ||
      this.slugify(data.title || "page");
    const slug = await this.generateUniqueSlug(siteId, baseSlug);

    const pageData = {
      ...data,
      slug,
    };

    const created = await super.create(siteId, pageData, userId, options);

    // Save initial version snapshot
    try {
      await versionService.save(siteId, "PAGE", created.id, created, userId);
    } catch (err) {
      console.error("Failed to save initial page version:", err);
    }

    return created;
  }

  slugify(text = "") {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-\/]+/g, "")
      .replace(/\-\-+/g, "-");
  }

  async generateUniqueSlug(siteId, baseSlug) {
    let candidate = baseSlug;
    let i = 0;
    while (
      RESERVED_SLUGS.includes(candidate.toLowerCase()) ||
      (await pageRepository.findFirst(siteId, {
        where: { slug: { in: [candidate, `/${candidate}`] } },
      }))
    ) {
      i += 1;
      candidate = `${baseSlug}-${i}`;
    }
    return candidate;
  }
}

export const pageService = new PageService();
