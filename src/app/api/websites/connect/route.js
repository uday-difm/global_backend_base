import { NextResponse } from "next/server";
import prisma from "@/lib/prisma.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, domain, websiteId } = body;

    const dbKey = await prisma.apiKey.findFirst({
      where: {
        key: apiKey,
        isActive: true,
        deletedAt: null
      }
    });

    if (!dbKey) {
      return NextResponse.json({ success: false, error: "Invalid or inactive API Key" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      websiteId: websiteId || dbKey.siteId,
      syncToken: "sync_token_default",
      message: "Website connected and registered successfully."
    });

  } catch (error) {
    console.error("Website connect error:", error);
    return NextResponse.json({ success: false, error: "Internal server error: " + error.message }, { status: 500 });
  }
}
