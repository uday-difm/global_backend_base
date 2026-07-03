import prisma from "@/lib/prisma";
import { NotFoundError } from "@/core/errors";

export class VersionService {
  /**
   * Save a new version snapshot for any entity type.
   */
  async save(siteId, entityType, entityId, data, userId = null) {
    // Get the latest version number for this entity
    const latest = await prisma.contentVersion.findFirst({
      where: { siteId, entityType, entityId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = latest ? latest.version + 1 : 1;

    return prisma.contentVersion.create({
      data: {
        siteId,
        entityType,
        entityId,
        version: nextVersion,
        data,
        createdBy: userId,
      },
    });
  }

  /**
   * List all versions for an entity, newest first.
   */
  async list(siteId, entityType, entityId) {
    return prisma.contentVersion.findMany({
      where: { siteId, entityType, entityId },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        createdBy: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get a specific version by ID.
   */
  async getById(siteId, versionId) {
    const version = await prisma.contentVersion.findFirst({
      where: { id: versionId, siteId },
    });
    if (!version) {
      throw new NotFoundError("Content version");
    }
    return version;
  }

  /**
   * Restore an entity to a previous version.
   * Returns the version data so the caller can apply it.
   */
  async getVersionData(siteId, entityType, entityId, versionId) {
    const version = await prisma.contentVersion.findFirst({
      where: { id: versionId, siteId, entityType, entityId },
    });
    if (!version) {
      throw new NotFoundError("Content version");
    }
    return version.data;
  }

  /**
   * Compare two versions and return their data for diffing.
   */
  async compare(siteId, versionId1, versionId2) {
    const [v1, v2] = await Promise.all([
      prisma.contentVersion.findFirst({ where: { id: versionId1, siteId } }),
      prisma.contentVersion.findFirst({ where: { id: versionId2, siteId } }),
    ]);

    if (!v1 || !v2) {
      throw new NotFoundError("One or both versions not found");
    }

    return {
      from: { version: v1.version, data: v1.data, createdAt: v1.createdAt },
      to: { version: v2.version, data: v2.data, createdAt: v2.createdAt },
    };
  }
}

export const versionService = new VersionService();
