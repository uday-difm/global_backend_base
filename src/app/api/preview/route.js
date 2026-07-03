// global_backend/src/app/api/preview/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/core/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");
    const siteId = searchParams.get("siteId");

    if (!pageId)
      return NextResponse.json({ error: "pageId required" }, { status: 400 });
    if (!siteId)
      return NextResponse.json({ error: "siteId required" }, { status: 400 });

    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page)
      return NextResponse.json({ error: "Page not found" }, { status: 404 });

    if (page.siteId !== siteId) {
      return NextResponse.json(
        { error: "Page does not belong to siteId" },
        { status: 400 },
      );
    }

    const sections = await prisma.section.findMany({
      where: { pageId, isDeleted: false },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ page, sections });
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 },
    );
  }
}
