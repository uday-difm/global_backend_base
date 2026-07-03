import { NextResponse } from "next/server";
import { postService } from "@/services/post.service";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function POST(req) {
  try {
    await postService.checkScheduledPosts();
    return NextResponse.json(apiSuccess({ message: "Scheduled posts processed successfully" }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(req) {
  try {
    await postService.checkScheduledPosts();
    return NextResponse.json(apiSuccess({ message: "Scheduled posts processed successfully" }));
  } catch (err) {
    return handleApiError(err);
  }
}
