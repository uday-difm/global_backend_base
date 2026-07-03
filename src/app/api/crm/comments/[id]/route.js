import { NextResponse } from "next/server";
import { commentService } from "@/services/comment.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function PUT(req, { params }) {
  try {
    const siteId = getSiteId(req);
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    const { status } = body;
    const comment = await commentService.updateCommentStatus(siteId, id, status);
    return NextResponse.json(apiSuccess({ comment }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req, { params }) {
  try {
    const siteId = getSiteId(req);
    const resolvedParams = await params;
    const id = resolvedParams.id;
    await commentService.deleteComment(siteId, id);
    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    return handleApiError(err);
  }
}
