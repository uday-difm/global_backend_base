import { NextResponse } from "next/server";
import { checkSitePermission } from "@/lib/apiAuth";
import { settingsService } from "@/services/settings.service";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const websiteSettings = await settingsService.getSettingsField(auth.siteId, "websiteSettings");
    return NextResponse.json(apiSuccess({ websiteSettings }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const result = await settingsService.updateSettingsField(
      auth.siteId,
      "websiteSettings",
      body,
      auth.user.id
    );

    return NextResponse.json(apiSuccess({ websiteSettings: result }));
  } catch (err) {
    return handleApiError(err);
  }
}

