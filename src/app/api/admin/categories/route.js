import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";
import { apiSuccess } from "@/core/errors";

function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// GET /api/admin/categories - List all categories for the site
export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { siteId: auth.siteId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
    return NextResponse.json(apiSuccess({ categories }));
  } catch (err) {
    console.error("Fetch categories error:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
});

// POST /api/admin/categories - Create a category
export async function POST(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const data = CreateCategorySchema.parse(body);

    const baseSlug = (data.slug && slugify(data.slug)) || slugify(data.name);

    // Check if category with this name or slug already exists for this site
    const existing = await prisma.category.findFirst({
      where: {
        siteId: auth.siteId,
        OR: [
          { name: { equals: data.name } },
          { slug: baseSlug },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name or slug already exists." },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: {
        siteId: auth.siteId,
        name: data.name.trim(),
        slug: baseSlug,
      },
    });

    return NextResponse.json(apiSuccess({ category }), { status: 201 });
  } catch (err) {
    console.error("Create category error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
