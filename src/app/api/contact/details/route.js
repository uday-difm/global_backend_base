import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/core/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId query parameter is required" }, { status: 400 });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { contactDetails: true }
    });

    return NextResponse.json(apiSuccess({ contactDetails: settings?.contactDetails || null }));
  } catch (err) {
    console.error("GET /api/contact/details error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
