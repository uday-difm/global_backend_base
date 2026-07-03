import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { apiSuccess } from "@/core/errors";

export async function GET() {
  try {
    const [totalUsers, totalMedia, totalSites, recentMedia] = await Promise.all(
      [
        prisma.user.count(),
        prisma.media.count(),
        prisma.site.count(),

        prisma.media.findMany({
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
        }),
      ],
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        totalMedia,
        totalSites,
      },
      recentMedia,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard",
      },
      {
        status: 500,
      },
    );
  }
}
