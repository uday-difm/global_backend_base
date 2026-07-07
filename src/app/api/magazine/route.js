import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || "ebh";

    const dbMagazines = await prisma.magazine.findMany({
      where: {
        status: 1 // Only fetch published magazines
      },
      orderBy: {
        date: "desc"
      }
    });

    // Map Prisma database keys to the frontend magazine property formats
    const mappedMagazines = dbMagazines.map((mag) => ({
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
    }));

    // Return the flat array directly as expected by the frontend
    return NextResponse.json(mappedMagazines);
  } catch (err) {
    console.error("Fetch public magazines error:", err);
    return NextResponse.json({ error: "Failed to fetch magazines", message: err.message }, { status: 500 });
  }
}
