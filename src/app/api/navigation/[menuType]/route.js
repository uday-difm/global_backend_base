import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/core/errors";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const menuType = params?.menuType;
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId || !menuType) {
      return NextResponse.json({ error: "siteId and menuType parameters are required" }, { status: 400 });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { navigation: true }
    });

    const navigation = settings?.navigation || {};
    const menuItems = navigation[menuType] || [];

    return NextResponse.json(apiSuccess({ menuType, items: menuItems }));
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
