import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

// GET /api/admin/forms/config  — fetch spam + notification settings
export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { securityControls: true, emailSettings: true },
    });

    const emailSettings = settings?.emailSettings || {};
    // Sanitize: never expose password
    const sanitizedEmail = {
      ...emailSettings,
      password: emailSettings.password ? "********" : "",
    };

    return NextResponse.json(
      apiSuccess({
        spamConfig: settings?.securityControls || {},
        emailSettings: sanitizedEmail,
      }),
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 },
    );
  }
}

// PUT /api/admin/forms/config  — update spam + notification + auto-reply settings
export async function PUT(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { spamConfig, emailSettings } = body;

    const existing = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { securityControls: true, emailSettings: true },
    });

    const currentSecurityControls = existing?.securityControls || {};
    const currentEmailSettings = existing?.emailSettings || {};

    // Build spam config update
    const updatedSecurity = spamConfig
      ? { ...currentSecurityControls, ...spamConfig }
      : currentSecurityControls;

    // Build email settings update (preserve existing password if not changed)
    let updatedEmail = currentEmailSettings;
    if (emailSettings) {
      updatedEmail = {
        ...currentEmailSettings,
        ...emailSettings,
        // Keep existing password if masked value is sent
        password:
          emailSettings.password && emailSettings.password !== "********"
            ? emailSettings.password
            : currentEmailSettings.password,
      };
    }

    await prisma.globalSettings.upsert({
      where: { siteId: auth.siteId },
      update: {
        securityControls: updatedSecurity,
        emailSettings: updatedEmail,
      },
      create: {
        siteId: auth.siteId,
        securityControls: updatedSecurity,
        emailSettings: updatedEmail,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update form config:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 },
    );
  }
}
