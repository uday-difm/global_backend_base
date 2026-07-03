import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function POST(req) {
  try {
    const sessionUser = await requireAuth();
    const isDev = process.env.NODE_ENV === "development";
    let user = sessionUser;
    if (!user && isDev) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    
    // In dev mode, if we bypass password checks, handle it or execute normally
    if (isDev && !currentPassword) {
      const hashedPassword = await require("bcryptjs").hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });
    } else {
      await authService.changePassword(user.id, currentPassword, newPassword);
    }

    return NextResponse.json(apiSuccess({ message: "Success" }));
  } catch (err) {
    return handleApiError(err);
  }
}
