import { getSiteId } from "@/lib/siteGuard";
import { mediaService } from "@/services/media.service";
import { handleApiError } from "@/core/errors";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const siteId = getSiteId(request);
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || "root";
    
    const media = await mediaService.repository.findByFolder(siteId, folderId);
    return NextResponse.json(media);
  } catch (err) {
    return handleApiError(err);
  }
}
