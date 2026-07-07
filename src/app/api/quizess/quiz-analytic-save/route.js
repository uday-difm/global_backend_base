import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, quizId, correct, choose_option, time_taken } = body;

    if (!userId || quizId === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const saved = await prisma.quizAnalytics.create({
      data: {
        userId: String(userId),
        quizId: Number(quizId),
        correct: correct ? 1 : 0,
        choose_option: String(choose_option || ""),
        time_taken: String(time_taken || "")
      }
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    console.error("POST /api/quizess/quiz-analytic-save error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
