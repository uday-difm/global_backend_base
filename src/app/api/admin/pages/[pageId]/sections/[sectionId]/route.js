import { NextResponse } from "next/server";
import { pageService } from "@/services/page.service";
import { sectionRepository } from "@/repositories/section.repository";
import { checkSitePermission } from "@/lib/apiAuth";
import { tryValidateByType } from "@/lib/validators/section";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function PATCH(req, { params }) {
  try {
    const { pageId, sectionId } = await params;
    const page = await pageService.getById(null, pageId);

    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (page.siteId !== auth.siteId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (page.isHardcoded) {
      return NextResponse.json({ error: "Forbidden: Cannot modify sections on hardcoded pages" }, { status: 400 });
    }

    const body = await req.json();

    if (body.content !== undefined || body.type !== undefined) {
      const section = await sectionRepository.findUnique(auth.siteId, sectionId);
      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      const effectiveType = body.type || section.type;
      const v = tryValidateByType(effectiveType, { content: body.content || section.content });
      if (!v.ok) {
        const errorDetail = (v.error.issues || v.error.errors)?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || String(v.error);
        console.error("Zod Validation Failed for Section:", effectiveType, errorDetail);
        return NextResponse.json({ error: `Validation failed: ${errorDetail}`, details: v.error.issues || v.error.errors }, { status: 400 });
      }
    }

    const updated = await pageService.updateSection(auth.siteId, sectionId, body);
    return NextResponse.json(apiSuccess({ section: updated }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { pageId, sectionId } = await params;
    const page = await pageService.getById(null, pageId);

    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (page.siteId !== auth.siteId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (page.isHardcoded) {
      return NextResponse.json({ error: "Forbidden: Cannot delete sections on hardcoded pages" }, { status: 400 });
    }

    await pageService.deleteSection(auth.siteId, sectionId);
    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    return handleApiError(err);
  }
}
