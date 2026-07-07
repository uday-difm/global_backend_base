import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import { uploadToS3 } from "@/../utils/s3Utility";
import cloudinary from "@/lib/cloudinary";
import { Readable } from "stream";

// Helper to upload to Cloudinary as fallback
async function uploadToCloudinary(buffer, fileName, folder = "magazines") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const formData = await request.formData();
    const magazine_id = formData.get("magazine_id");
    const magazine_title = formData.get("magazine_title");
    const magazine_description = formData.get("magazine_description");
    const magazine_tags = formData.get("magazine_tags");
    const magazine_cover_image = formData.get("magazine_cover_image"); // File
    const magazine_link = formData.get("magazine_link");
    const magazine_date = formData.get("magazine_date");
    const magazine_category = formData.get("magazine_category");
    const MagCloudLink = formData.get("MagCloudLink");
    const magazine_slug = formData.get("magazine_slug");
    const status = parseInt(formData.get("status") || "1");

    if (!magazine_title || !magazine_slug || !magazine_date) {
      return NextResponse.json({ error: "Title, slug, and date are required." }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.magazine.findUnique({
      where: { slug: magazine_slug },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists. Please choose a different title." }, { status: 400 });
    }

    // Handle cover image upload
    let imageUrl = "";
    if (magazine_cover_image && typeof magazine_cover_image === "object" && "arrayBuffer" in magazine_cover_image) {
      const buffer = Buffer.from(await magazine_cover_image.arrayBuffer());
      
      // Check S3 credentials
      if (process.env.ACCESSKEY && process.env.SECRETKEY && process.env.BUCKET) {
        try {
          imageUrl = await uploadToS3("magazines", {
            originalname: magazine_cover_image.name,
            buffer,
            mimetype: magazine_cover_image.type,
          });
        } catch (s3Error) {
          console.error("S3 upload failed, trying Cloudinary...", s3Error);
        }
      }

      // Fallback to Cloudinary if S3 upload didn't run or failed
      if (!imageUrl) {
        try {
          imageUrl = await uploadToCloudinary(buffer, magazine_cover_image.name);
        } catch (cloudinaryError) {
          console.error("Cloudinary upload failed:", cloudinaryError);
          return NextResponse.json({ error: "Failed to upload cover image." }, { status: 500 });
        }
      }
    }

    // Create magazine issue in Prisma
    const magazine = await prisma.magazine.create({
      data: {
        magazineId: magazine_id || "",
        title: magazine_title,
        description: magazine_description || "",
        tags: magazine_tags || "",
        coverImage: imageUrl,
        link: magazine_link || "",
        date: new Date(magazine_date),
        category: magazine_category || "",
        magCloudLink: MagCloudLink || "",
        slug: magazine_slug,
        status,
      },
    });

    return NextResponse.json({ success: true, magazine });
  } catch (error) {
    console.error("Error creating magazine:", error);
    return NextResponse.json({ error: "Failed to create magazine." }, { status: 500 });
  }
}
