import cloudinary from "@/lib/cloudinary";
import sharp from "sharp";
import { Readable } from "stream";
import { mediaRepository } from "@/repositories/media.repository";
import { mediaFolderRepository } from "@/repositories/mediaFolder.repository";
import { BaseService } from "@/core/service";
import { NotFoundError, ValidationError } from "@/core/errors";
import prisma from "@/lib/prisma";

export class MediaService extends BaseService {
  constructor() {
    super(mediaRepository);
  }

  async uploadToCloudinary(buffer, fileName, folder = "global-cms") {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          quality: "auto",
          fetch_format: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async uploadMedia(siteId, buffer, fileName, mimeType, folderId = null) {
    const folderIdVal = (folderId === "root" || folderId === "null" || !folderId) ? null : folderId;

    if (folderIdVal) {
      const folder = await mediaFolderRepository.findUnique(siteId, folderIdVal);
      if (!folder) {
        throw new ValidationError("Target folder not found on this site");
      }
    }

    const result = await this.uploadToCloudinary(buffer, fileName, `site-${siteId}`);

    const media = await mediaRepository.create(siteId, {
      fileName,
      originalName: fileName,
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      mimeType,
      extension: result.format,
      size: result.bytes,
      width: result.width || null,
      height: result.height || null,
      folderId: folderIdVal,
      isImage: mimeType.startsWith("image/"),
      isVideo: mimeType.startsWith("video/"),
      isDocument: !mimeType.startsWith("image/") && !mimeType.startsWith("video/"),
    });

    return media;
  }

  async deleteMedia(siteId, mediaId) {
    const media = await mediaRepository.findUnique(siteId, mediaId);
    if (!media) {
      throw new NotFoundError("Media");
    }

    try {
      await cloudinary.uploader.destroy(media.publicId);
    } catch (err) {
      console.warn("Cloudinary file deletion warning:", err.message);
    }

    await mediaRepository.delete(siteId, mediaId);
    return { success: true };
  }

  async _cascadeMediaUrlUpdate(siteId, oldUrl, oldSecureUrl, newUrl, newSecureUrl) {
    if (!oldUrl && !oldSecureUrl) return;
    if (oldUrl === newUrl && oldSecureUrl === newSecureUrl) return;

    const urlsToFind = [oldUrl, oldSecureUrl].filter(Boolean);
    if (urlsToFind.length === 0) return;

    // Update TeamMember table
    await prisma.teamMember.updateMany({
      where: {
        siteId,
        photo: { in: urlsToFind },
      },
      data: {
        photo: newSecureUrl || newUrl,
      },
    });

    // Update Testimonial table
    await prisma.testimonial.updateMany({
      where: {
        siteId,
        clientImage: { in: urlsToFind },
      },
      data: {
        clientImage: newSecureUrl || newUrl,
      },
    });
  }

  async replaceMedia(siteId, mediaId, buffer, fileName, mimeType) {
    const media = await mediaRepository.findUnique(siteId, mediaId);
    if (!media) {
      throw new NotFoundError("Media");
    }
    const oldUrl = media.url;
    const oldSecureUrl = media.secureUrl;

    try {
      await cloudinary.uploader.destroy(media.publicId);
    } catch (err) {
      console.warn("Cloudinary replace deletion warning:", err.message);
    }

    const result = await this.uploadToCloudinary(buffer, fileName, `site-${siteId}`);

    const updated = await mediaRepository.update(siteId, mediaId, {
      fileName,
      originalName: fileName,
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      mimeType,
      extension: result.format,
      size: result.bytes,
      width: result.width || null,
      height: result.height || null,
      isImage: mimeType.startsWith("image/"),
      isVideo: mimeType.startsWith("video/"),
      isDocument: !mimeType.startsWith("image/") && !mimeType.startsWith("video/"),
    });

    await this._cascadeMediaUrlUpdate(siteId, oldUrl, oldSecureUrl, updated.url, updated.secureUrl);

    return updated;
  }

  async renameMedia(siteId, mediaId, newName, altText, folderId = undefined) {
    const media = await mediaRepository.findUnique(siteId, mediaId);
    if (!media) {
      throw new NotFoundError("Media");
    }
    const oldUrl = media.url;
    const oldSecureUrl = media.secureUrl;

    const updateData = {};
    if (newName !== undefined && newName.trim() !== "") updateData.fileName = newName.trim();
    if (altText !== undefined) updateData.altText = altText;
    if (folderId !== undefined) {
      updateData.folderId = (folderId === "root" || folderId === "null" || !folderId) ? null : folderId;
    }

    const updated = await mediaRepository.update(siteId, mediaId, updateData);

    await this._cascadeMediaUrlUpdate(siteId, oldUrl, oldSecureUrl, updated.url, updated.secureUrl);

    return updated;
  }

  async compressImage(siteId, mediaId) {
    const media = await mediaRepository.findUnique(siteId, mediaId);
    if (!media) {
      throw new NotFoundError("Media");
    }

    if (!media.isImage) {
      throw new ValidationError("Only image files can be compressed");
    }

    const res = await fetch(media.url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = media.fileName.replace(/\.[^/.]+$/, "") + ".webp";
    const result = await this.uploadToCloudinary(compressedBuffer, fileName, `site-${siteId}`);

    try {
      await cloudinary.uploader.destroy(media.publicId);
    } catch { }

    const updated = await mediaRepository.update(siteId, mediaId, {
      fileName,
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      mimeType: "image/webp",
      extension: "webp",
      size: result.bytes,
      width: result.width || null,
      height: result.height || null,
    });

    return updated;
  }

  // --- Folder Management ---
  async getFolders(siteId, parentId = null) {
    return mediaFolderRepository.findSubfolders(siteId, parentId);
  }

  async createFolder(siteId, name, parentId = null) {
    const parentIdVal = (parentId === "root" || parentId === "null" || !parentId) ? null : parentId;
    if (parentIdVal) {
      const parentFolder = await mediaFolderRepository.findUnique(siteId, parentIdVal);
      if (!parentFolder) {
        throw new ValidationError("Parent folder not found");
      }
    }
    return mediaFolderRepository.create(siteId, {
      name,
      parentId: parentIdVal,
    });
  }

  async renameFolder(siteId, folderId, newName) {
    const folder = await mediaFolderRepository.findUnique(siteId, folderId);
    if (!folder) {
      throw new NotFoundError("Folder");
    }
    return mediaFolderRepository.update(siteId, folderId, {
      name: newName,
    });
  }

  async _getAllSubfolderIds(siteId, folderId) {
    const ids = [];
    const queue = [folderId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = await prisma.mediaFolder.findMany({
        where: { siteId, parentId: currentId },
        select: { id: true }
      });
      for (const child of children) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }
    return ids;
  }

  async deleteFolder(siteId, folderId) {
    const folder = await mediaFolderRepository.findUnique(siteId, folderId);
    if (!folder) {
      throw new NotFoundError("Folder");
    }

    const subfolderIds = await this._getAllSubfolderIds(siteId, folderId);
    const allFolderIds = [folderId, ...subfolderIds];

    // 1. Find all media items inside this folder and all nested folders
    const mediaItems = await prisma.media.findMany({
      where: { siteId, folderId: { in: allFolderIds } },
      select: { id: true, publicId: true }
    });

    // 2. Delete all those files from Cloudinary
    for (const item of mediaItems) {
      try {
        await cloudinary.uploader.destroy(item.publicId);
      } catch (err) {
        console.warn("Cloudinary file deletion warning during cascade:", err.message);
      }
    }

    // 3. Delete database records in cascade order
    await prisma.$transaction([
      prisma.media.deleteMany({
        where: { siteId, folderId: { in: allFolderIds } }
      }),
      prisma.mediaFolder.deleteMany({
        where: { siteId, id: { in: subfolderIds } }
      }),
      prisma.mediaFolder.delete({
        where: { id: folderId, siteId }
      })
    ]);

    return { success: true };
  }
}

export const mediaService = new MediaService();
