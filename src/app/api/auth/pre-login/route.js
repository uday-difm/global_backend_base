import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/core/errors";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { twoFAEnabled: true },
    });

    // Return false for unknown emails to prevent enumeration
    return NextResponse.json(apiSuccess({ twoFARequired: user?.twoFAEnabled ?? false }));
  } catch (err) {
    console.error("Pre-login check error:", err);
    return NextResponse.json(
      { error: "Failed to check login requirements" },
      { status: 500 },
    );
  }
}
