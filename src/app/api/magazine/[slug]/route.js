import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const slug = params?.slug;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const mag = await prisma.magazine.findFirst({
      where: {
        slug,
        status: 1 // Only fetch if published
      }
    });

    if (!mag) {
      return NextResponse.json({ error: "Magazine not found" }, { status: 404 });
    }

    const mapped = {
      id: mag.id,
      magazine_id: mag.magazineId,
      magazine_title: mag.title,
      magazine_description: mag.description,
      magazine_tags: mag.tags,
      magazine_cover_image: mag.coverImage,
      magazine_link: mag.link,
      magazine_date: mag.date,
      magazine_category: mag.category,
      MagCloudLink: mag.magCloudLink,
      magazine_slug: mag.slug,
      status: mag.status
    };

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Fetch magazine details error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
