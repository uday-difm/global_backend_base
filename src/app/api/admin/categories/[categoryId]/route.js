import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { apiSuccess } from "@/core/errors";

// PATCH /api/admin/categories/[categoryId] - Rename a category
export async function PATCH(req, context) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const { categoryId } = params;
  const body = await req.json();
  const { name } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Category name is required" },
      { status: 400 },
    );
  }

  try {
    // Verify the category belongs to the authenticated site
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, siteId: auth.siteId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name: name.trim() },
    });

    return NextResponse.json(apiSuccess({ category }));
  } catch (err) {
    console.error("Rename category error:", err);
    return NextResponse.json(
      { error: "Failed to rename category" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/categories/[categoryId] - Delete a category
export async function DELETE(req, context) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const { categoryId } = params;

  try {
    // Verify the category belongs to the authenticated site
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, siteId: auth.siteId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json(
      apiSuccess({ message: "Category deleted successfully" }),
    );
  } catch (err) {
    console.error("Delete category error:", err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
