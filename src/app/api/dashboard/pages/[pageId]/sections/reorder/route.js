import { NextResponse } from "next/server";
import { pageService } from "@/services/page.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function POST(req, { params }) {
  try {
    const { pageId } = await params;
    const page = await pageService.getById(null, pageId);

    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (page.siteId !== auth.siteId) {
      return NextResponse.json({ error: "Forbidden: Page belongs to another site" }, { status: 403 });
    }

    if (page.isHardcoded) {
      return NextResponse.json({ error: "Forbidden: Cannot reorder sections on hardcoded pages" }, { status: 400 });
    }

    const body = await req.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
    }

    await pageService.reorderSections(auth.siteId, pageId, orderedIds);
    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    return handleApiError(err);
  }
}
