import { NextResponse } from "next/server";
import { pageService } from "@/services/page.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req, { params }) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }


    const { pageId } = await params;
    const page = await pageService.getById(auth.siteId, pageId);
    return NextResponse.json(apiSuccess({ page }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req, { params }) {
  try {
    console.log("PATCH headers:", Object.fromEntries(req.headers.entries()));
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }


    const { pageId } = await params;
    const body = await req.json();

    // Check publish permission
    const current = await pageService.getById(auth.siteId, pageId);
    if (current.isHardcoded) {
      if (body.status && body.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Cannot change the publication status of a hardcoded frontend route" }, { status: 400 });
      }
      if (body.isHardcoded !== undefined && body.isHardcoded !== true) {
        return NextResponse.json({ error: "Cannot change the hardcoded field of a hardcoded frontend route" }, { status: 400 });
      }
    }

    if (body.status && body.status !== current.status) {
      const authAdmin = await checkSitePermission(req, "ADMIN");
      if (authAdmin.error) {
        return NextResponse.json({ error: "Only admins can change page status" }, { status: 403 });
      }
    }

    const updatedPage = await pageService.update(auth.siteId, pageId, body, auth.user.id);
    return NextResponse.json(apiSuccess({ page: updatedPage }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await checkSitePermission(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { pageId } = await params;
    const current = await pageService.getById(auth.siteId, pageId);
    if (current.isHardcoded) {
      return NextResponse.json({ error: "Cannot delete a hardcoded frontend route" }, { status: 400 });
    }

    await pageService.delete(auth.siteId, pageId, auth.user.id);

    return NextResponse.json(apiSuccess({ message: "Page successfully deleted" }));
  } catch (err) {
    return handleApiError(err);
  }
}
