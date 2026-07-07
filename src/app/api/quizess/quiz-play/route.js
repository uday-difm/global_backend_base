import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const analyticsCount = await prisma.quizAnalytics.count({
      where: { userId: String(userId) }
    });

    return NextResponse.json({ played: analyticsCount > 0 });
  } catch (err) {
    console.error("GET /api/quizess/quiz-play error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
