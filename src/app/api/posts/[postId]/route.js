import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const siteId = getSiteId(req);
    const { postId } = await params;
    const { searchParams } = new URL(req.url);
    const preview = searchParams.get("preview") === "true";

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID or slug is required" },
        { status: 400 },
      );
    }

    // Try finding by CUID or ID first
    let post = await prisma.post.findFirst({
      where: {
        id: postId,
        siteId,
        ...(preview
          ? {}
          : { status: "PUBLISHED", publishedAt: { lte: new Date() } }),
        deletedAt: null,
      },
      include: {
        categories: true,
        tags: true,
        author: { select: { id: true, email: true } },
        featuredImage: true,
      },
    });

    // Fall back to finding by slug
    if (!post) {
      post = await prisma.post.findFirst({
        where: {
          slug: postId,
          siteId,
          ...(preview
            ? {}
            : { status: "PUBLISHED", publishedAt: { lte: new Date() } }),
          deletedAt: null,
        },
        include: {
          categories: true,
          tags: true,
          author: { select: { id: true, email: true } },
          featuredImage: true,
        },
      });
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(apiSuccess({ post }));
  } catch (err) {
    return handleApiError(err);
  }
}
