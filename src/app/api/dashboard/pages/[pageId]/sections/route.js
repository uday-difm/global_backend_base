import { NextResponse } from "next/server";
import { pageService } from "@/services/page.service";
import { sectionRepository } from "@/repositories/section.repository";
import { checkSitePermission } from "@/lib/apiAuth";
import { tryValidateByType } from "@/lib/validators/section";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req, { params }) {
  try {
    const { pageId } = await params;
    const page = await pageService.getById(null, pageId); // bypass site check initially to fetch page

    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (page.siteId !== auth.siteId) {
      return NextResponse.json({ error: "Forbidden: Page belongs to another site" }, { status: 403 });
    }

    const sections = await sectionRepository.findMany(auth.siteId, {
      where: { pageId, isDeleted: false },
      orderBy: { order: "asc" }
    });

    return NextResponse.json(apiSuccess({ sections }));
  } catch (err) {
    return handleApiError(err);
  }
}

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
      return NextResponse.json({ error: "Forbidden: Cannot add sections to hardcoded pages" }, { status: 400 });
    }

    const body = await req.json();
    const { type, content, name, order } = body;

    if (!type) {
      return NextResponse.json({ error: "Section type is required" }, { status: 400 });
    }

    // Validate using existing validator schemas
    const v = tryValidateByType(type, body);
    if (!v.ok) {
      return NextResponse.json({ error: "Validation failed", details: v.error.issues || v.error.errors || String(v.error) }, { status: 400 });
    }

    const section = await pageService.addSection(auth.siteId, pageId, {
      type,
      content: content || {},
      name,
      order
    });

    return NextResponse.json(apiSuccess({ section }), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
