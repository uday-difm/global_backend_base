import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const record = await prisma.ipQuizAnalytic.findFirst({
      where: { user_ip: ip }
    });

    if (record) {
      await prisma.ipQuizAnalytic.update({
        where: { id: record.id },
        data: { played: record.played + 1 }
      });
    } else {
      await prisma.ipQuizAnalytic.create({
        data: {
          user_ip: ip,
          played: 1
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/quizess/save-ip-quiz-play error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
