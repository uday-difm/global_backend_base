import { NextResponse } from "next/server";
import { checkSitePermission } from "@/lib/apiAuth";
import { apiSuccess } from "@/core/errors";
import { emailService } from "@/services/email.service";

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Test the connection using emailService which handles both SMTP and Resend
    const connectionResult = await emailService.testConnection(auth.siteId);

    // Send a test email to the authenticated user
    const testResult = await emailService.sendTestEmail(
      auth.siteId,
      auth.user.email,
    );

    return NextResponse.json(
      apiSuccess({
        message: testResult.message,
        connection: connectionResult,
      }),
    );
  } catch (err) {
    console.error("Email Test Error:", err);

    // Log failure
    try {
      await emailService.logEmailFailure(auth.siteId, err.message, {
        context: "connection-test",
        to: auth.user.email,
      });
    } catch (logErr) {
      console.error("Failed to save email fail log to DB:", logErr);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Email connection failed",
        message: err.message,
      },
      { status: 500 },
    );
  }
}
