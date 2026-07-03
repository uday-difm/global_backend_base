import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const siteId = getSiteId(req);
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const pageVal = searchParams.get("page");
    const limitVal = searchParams.get("limit");

    const where = {
      siteId,
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
      ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { excerpt: { contains: search } },
              { contentJson: { contains: search } },
            ],
          }
        : {}),
    };

    let posts;
    let pagination = null;

    if (pageVal || limitVal) {
      const page = parseInt(pageVal || "1", 10);
      const limit = parseInt(limitVal || "5", 10);
      const skip = (page - 1) * limit;

      const [totalPosts, paginatedPosts] = await Promise.all([
        prisma.post.count({ where }),
        prisma.post.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          include: {
            categories: true,
            tags: true,
            author: { select: { id: true, email: true, name: true, bio: true } },
            featuredImage: true,
          },
        }),
      ]);

      posts = paginatedPosts;
      pagination = {
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
      };
    } else {
      posts = await prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          categories: true,
          tags: true,
          author: { select: { id: true, email: true, name: true, bio: true } },
          featuredImage: true,
        },
      });
    }

    return NextResponse.json(apiSuccess({ posts, pagination }));
  } catch (err) {
    return handleApiError(err);
  }
}

