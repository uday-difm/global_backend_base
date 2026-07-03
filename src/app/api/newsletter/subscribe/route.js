import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subscriberService } from "@/services/subscriber.service";
import { apiSuccess } from "@/core/errors";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId parameter is required" }, { status: 400 });
    }

    // Verify site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const body = await req.json();
    const { email, name, metadata, listIds } = body;

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Sync legacy Newsletter table
    const existingLegacy = await prisma.newsletter.findFirst({
      where: { siteId, email: cleanEmail },
    });
    
    if (!existingLegacy) {
      await prisma.newsletter.create({
        data: { siteId, email: cleanEmail, status: "active" },
      });
    } else if (existingLegacy.status !== "active") {
      await prisma.newsletter.update({
        where: { id: existingLegacy.id },
        data: { status: "active" },
      });
    }

    // 2. CRM Subscriber (Marketing CRM) sync
    const subscriber = await subscriberService.createSubscriber(siteId, {
      email: cleanEmail,
      name: name || null,
      status: "active",
      tags: "newsletter-signup",
      metadata: metadata || { source: "newsletter-form" },
      listIds: listIds || [],
    });

    return NextResponse.json(apiSuccess({ subscriber }));
  } catch (err) {
    console.error("POST /api/newsletter/subscribe error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
