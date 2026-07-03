import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req) {
  try {
    const siteId = getSiteId(req);
    const ads = await prisma.ad.findMany({
      where: {
        isActive: true,
        zone: {
          siteId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(apiSuccess({ ads }));
  } catch (err) {
    return handleApiError(err);
  }
}
