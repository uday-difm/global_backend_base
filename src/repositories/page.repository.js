import { BaseRepository } from "@/core/repository";

export class PageRepository extends BaseRepository {
  constructor() {
    super("page");
  }

  async findBySlug(siteId, slug) {
    const slugWithSlash = slug.startsWith("/") ? slug : `/${slug}`;
    const slugWithoutSlash = slug.startsWith("/") ? slug.substring(1) : slug;

    return this.findFirst(siteId, {
      where: {
        slug: { in: [slugWithSlash, slugWithoutSlash] }
      },
      include: { sections: { where: { isDeleted: false }, orderBy: { order: "asc" } } },
      orderBy: [{ status: "desc" }, { createdAt: "asc" }],
    });
  }
}

export const pageRepository = new PageRepository();
