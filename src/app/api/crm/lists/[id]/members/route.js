import { NextResponse } from "next/server";
import { subscriberService } from "@/services/subscriber.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req, { params }) {
  try {
    const siteId = getSiteId(req);
    const resolvedParams = await params;
    const listId = resolvedParams.id;
    const members = await subscriberService.getListMembers(siteId, listId);
    return NextResponse.json(apiSuccess({ members }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req, { params }) {
  try {
    const siteId = getSiteId(req);
    const resolvedParams = await params;
    const listId = resolvedParams.id;
    const body = await req.json();
    const { subscriberId } = body;
    if (!subscriberId) {
      return NextResponse.json({ error: "subscriberId is required" }, { status: 400 });
    }
    const member = await subscriberService.addSubscriberToList(siteId, listId, subscriberId);
    return NextResponse.json(apiSuccess({ member }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req, { params }) {
  try {
    const siteId = getSiteId(req);
    const resolvedParams = await params;
    const listId = resolvedParams.id;
    const url = new URL(req.url);
    const subscriberId = url.searchParams.get("subscriberId");
    if (!subscriberId) {
      return NextResponse.json({ error: "subscriberId parameter is required" }, { status: 400 });
    }
    await subscriberService.removeSubscriberFromList(siteId, listId, subscriberId);
    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    return handleApiError(err);
  }
}
