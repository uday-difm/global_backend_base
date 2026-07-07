import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, name, username, email, password } = body;

    if (action === "register") {
      if (!email || !username || !password || !name) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
      }

      // Check if user exists
      const existingUser = await prisma.auth.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email or username already registered" }, { status: 400 });
      }

      // Create new user
      const user = await prisma.auth.create({
        data: {
          name,
          username,
          email,
          password: hashPassword(password),
          role: "user"
        }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email
        }
      });
    }

    if (action === "login") {
      if (!username || !password) {
        return NextResponse.json({ error: "Username/email and password are required" }, { status: 400 });
      }

      // Find user
      const user = await prisma.auth.findFirst({
        where: {
          OR: [
            { email: username },
            { username: username }
          ]
        }
      });

      if (!user || user.password !== hashPassword(password)) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/quizess/auth error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
