import { NextResponse } from "next/server";
import { commentService } from "@/services/comment.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req) {
  try {
    const siteId = getSiteId(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "";
    const comments = await commentService.getComments(siteId, status || null);
    return NextResponse.json(apiSuccess({ comments }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req) {
  try {
    const siteId = getSiteId(req);
    const body = await req.json();
    const comment = await commentService.createComment(siteId, body);
    return NextResponse.json(apiSuccess({ comment }));
  } catch (err) {
    return handleApiError(err);
  }
}
