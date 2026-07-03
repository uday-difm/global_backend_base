import { NextResponse } from "next/server";
import { pushService } from "@/services/push.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req) {
  try {
    const siteId = getSiteId(req);
    const notifications = await pushService.getNotifications(siteId);
    return NextResponse.json(apiSuccess({ notifications }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req) {
  try {
    const siteId = getSiteId(req);
    const body = await req.json();
    const notification = await pushService.createNotification(siteId, body);
    return NextResponse.json(apiSuccess({ notification }));
  } catch (err) {
    return handleApiError(err);
  }
}
