import { BaseRepository } from "@/core/repository";

export class MediaRepository extends BaseRepository {
  constructor() {
    super("media");
  }

  async findByFolder(siteId, folderId = null) {
    return this.findMany(siteId, {
      where: { folderId: folderId === "root" ? null : folderId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const mediaRepository = new MediaRepository();
