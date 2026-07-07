import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany();
    const formatted = quizzes.map((q) => {
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(q.options);
        if (!Array.isArray(parsedOptions)) {
          parsedOptions = q.options.split(",").map(o => o.trim());
        }
      } catch {
        parsedOptions = q.options.split(",").map(o => o.trim());
      }

      let corrAnswerIndex = 0;
      if (!isNaN(Number(q.correctAnswer))) {
        corrAnswerIndex = Number(q.correctAnswer);
      } else {
        const foundIdx = parsedOptions.findIndex(o => o.toLowerCase() === q.correctAnswer.toLowerCase());
        if (foundIdx !== -1) {
          corrAnswerIndex = foundIdx;
        }
      }

      return {
        _id: q.id,
        question: q.question,
        options: parsedOptions,
        correctAnswer: corrAnswerIndex,
        explanation: q.explanation || ""
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/quizess/quiz error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
