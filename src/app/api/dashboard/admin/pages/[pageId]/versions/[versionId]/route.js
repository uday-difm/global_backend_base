import { NextResponse } from "next/server";
import { versionService } from "@/services/version.service";
import { pageService } from "@/services/page.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req, { params }) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { pageId, versionId } = await params;
    const data = await versionService.getVersionData(
      auth.siteId,
      "PAGE",
      pageId,
      versionId,
    );
    return NextResponse.json(apiSuccess({ version: data }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req, { params }) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { pageId, versionId } = await params;

    // Get the version data to restore
    const versionData = await versionService.getVersionData(
      auth.siteId,
      "PAGE",
      pageId,
      versionId,
    );

    // Exclude fields that shouldn't be overwritten
    const {
      id,
      siteId,
      createdAt,
      updatedAt,
      deletedAt,
      sections,
      faqs,
      syncedRoutes,
      ...restorable
    } = versionData;

    const restored = await pageService.update(
      auth.siteId,
      pageId,
      restorable,
      auth.user.id,
    );
    return NextResponse.json(apiSuccess({ page: restored }));
  } catch (err) {
    return handleApiError(err);
  }
}
