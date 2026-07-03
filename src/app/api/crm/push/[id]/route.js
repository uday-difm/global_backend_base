import { NextResponse } from "next/server";
import { pushService } from "@/services/push.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function DELETE(req, { params }) {
  try {
    const siteId = getSiteId(req);
    const id = params.id;
    await pushService.deleteNotification(siteId, id);
    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    return handleApiError(err);
  }
}
