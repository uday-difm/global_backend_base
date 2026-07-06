import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// GET /api/admin/quizzes — list all questions with analytics counts
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { id: "asc" },
    });

    // Attach play count per question
    const analytics = await prisma.quizAnalytics.groupBy({
      by: ["quizId"],
      _count: { id: true },
    });
    const countMap = Object.fromEntries(analytics.map((a) => [a.quizId, a._count.id]));

    const data = quizzes.map((q) => ({
      ...q,
      playCount: countMap[q.id] ?? 0,
      options: (() => {
        try {
          const parsed = JSON.parse(q.options);
          return Array.isArray(parsed) ? parsed : q.options.split(",").map((o) => o.trim());
        } catch {
          return q.options.split(",").map((o) => o.trim());
        }
      })(),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/admin/quizzes error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/quizzes — create a new question
export async function POST(req) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPERADMIN", "ADMIN", "EDITOR"].includes(user.globalRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { question, options, correctAnswer, explanation } = body;

    if (!question || !options || correctAnswer === undefined || correctAnswer === "") {
      return NextResponse.json({ error: "question, options, and correctAnswer are required" }, { status: 400 });
    }

    const optionsJson = JSON.stringify(
      Array.isArray(options) ? options : options.split(",").map((o) => o.trim())
    );

    const quiz = await prisma.quiz.create({
      data: {
        question: question.trim(),
        options: optionsJson,
        correctAnswer: String(correctAnswer),
        explanation: (explanation || "").trim(),
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/quizzes error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
