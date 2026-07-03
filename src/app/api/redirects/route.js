import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/core/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const sourceParam = searchParams.get("source");
    if (sourceParam) {
      const formattedSource = sourceParam.trim().startsWith("/")
        ? sourceParam.trim()
        : `/${sourceParam.trim()}`;

      const redirect = await prisma.redirect.findUnique({
        where: {
          siteId_source: {
            siteId,
            source: formattedSource
          }
        }
      });

      return NextResponse.json(apiSuccess({ redirect }));
    }

    const redirects = await prisma.redirect.findMany({
      where: { siteId }
    });

    return NextResponse.json(apiSuccess({ redirects }));
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
