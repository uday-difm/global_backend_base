import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import nodemailer from "nodemailer";
import { z } from "zod";
import { EventBus } from "@/core/events";
import { apiSuccess } from "@/core/errors";

const FormSubmitSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  recaptchaToken: z.string().optional(),
  // Honeypot field — must be empty
  _hp: z.string().optional(),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = FormSubmitSchema.safeParse(body);
    if (!parsed.success) {
      const siteId =
        body && typeof body.siteId === "string" ? body.siteId : "unknown";
      if (siteId !== "unknown") {
        try {
          EventBus.emit("form.failed", {
            siteId,
            data: {
              message:
                "Validation failed: " +
                (parsed.error.issues || parsed.error.errors)
                  .map((e) => `${e.path.join(".")}: ${e.message}`)
                  .join(", "),
              payload: body,
            },
          });
        } catch (e) {
          console.error("Failed to emit form.failed event:", e);
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.issues || parsed.error.errors,
        },
        { status: 400 },
      );
    }

    const { siteId, name, email, phone, message, recaptchaToken, _hp } =
      parsed.data;

    // ── Honeypot check ─────────────────────────────────────────────────────────
    // Bots fill in all fields; real users leave honeypot blank
    if (_hp && _hp.trim().length > 0) {
      // Silently accept but do not persist (anti-bot)
      return NextResponse.json(
        apiSuccess({ message: "Form submitted successfully" }),
      );
    }

    // Check if site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Site not found" },
        { status: 404 },
      );
    }

    // Check if IP is blocked & Rate limiting
    try {
      const ip = req.headers.get("x-forwarded-for") || "unknown";
      const { securityService } = await import("@/services/security.service");
      const isBlocked = await securityService.isIpBlocked(siteId, ip);
      if (isBlocked) {
        try {
          EventBus.emit("form.failed", {
            siteId,
            data: {
              message: `Blocked IP (${ip}) attempted form submission`,
              payload: { name, email, ip },
            },
          });
        } catch (e) {}
        return NextResponse.json(
          { success: false, error: "Access Denied: Your IP is blocked" },
          { status: 403 },
        );
      }

      const controls = await securityService.getSecurityControls(siteId);
      const limitRps = controls.rateLimitRps || 60;
      const { checkRateLimit } = await import("@/lib/rateLimiter");
      const allowed = checkRateLimit(ip, limitRps);
      if (!allowed) {
        try {
          EventBus.emit("form.failed", {
            siteId,
            data: {
              message: `IP rate limit exceeded (${ip})`,
              payload: { name, email, ip },
            },
          });
        } catch (e) {}
        return NextResponse.json(
          { success: false, error: "Too Many Requests: Rate limit exceeded" },
          { status: 429 },
        );
      }
    } catch (e) {
      console.error("IP check / Rate limit failed in form submission:", e);
    }

    // ── Load settings ──────────────────────────────────────────────────────────
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { securityControls: true, emailSettings: true },
    });

    const secControls = settings?.securityControls || {};

    // ── Google reCAPTCHA check ──────────────────────────────────────────────────
    if (secControls.recaptchaSecretKey) {
      if (!recaptchaToken) {
        try {
          EventBus.emit("form.failed", {
            siteId,
            data: {
              message: "reCAPTCHA verification token missing",
              payload: { name, email },
            },
          });
        } catch (e) {}
        return NextResponse.json(
          { success: false, error: "reCAPTCHA verification is required" },
          { status: 400 },
        );
      }

      try {
        const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
        const queryParams = new URLSearchParams({
          secret: secControls.recaptchaSecretKey,
          response: recaptchaToken,
        });

        const verifyRes = await fetch(
          `${verifyUrl}?${queryParams.toString()}`,
          {
            method: "POST",
          },
        );

        const verifyJson = await verifyRes.json();
        if (!verifyJson.success) {
          try {
            EventBus.emit("form.failed", {
              siteId,
              data: {
                message: "reCAPTCHA verification failed",
                payload: { name, email },
              },
            });
          } catch (e) {}
          return NextResponse.json(
            { success: false, error: "reCAPTCHA verification failed" },
            { status: 400 },
          );
        }
      } catch (captchaErr) {
        console.error(
          "Google reCAPTCHA validation failed:",
          captchaErr.message,
        );
        try {
          EventBus.emit("form.failed", {
            siteId,
            data: {
              message: `reCAPTCHA validation service error: ${captchaErr.message}`,
              payload: { name, email },
            },
          });
        } catch (e) {}
        return NextResponse.json(
          {
            success: false,
            error: "Security check validation service temporarily unavailable",
          },
          { status: 400 },
        );
      }
    }

    // ── Spam keyword filter ────────────────────────────────────────────────────
    if (secControls.spamFilterEnabled) {
      const blockedKeywords = secControls.spamKeywords || [
        "spam",
        "casino",
        "viagra",
        "crypto",
      ];
      const combined = `${name} ${email} ${message}`.toLowerCase();
      const isSpam = blockedKeywords.some((kw) =>
        combined.includes(kw.toLowerCase()),
      );
      if (isSpam) {
        try {
          EventBus.emit("form.failed", {
            siteId,
            data: {
              message: "Submission blocked by spam keyword filter",
              payload: { name, email, message },
            },
          });
        } catch (e) {}
        return NextResponse.json(
          { success: false, error: "Submission blocked as spam" },
          { status: 400 },
        );
      }
    }

    // ── Rate limiting: max 5 submissions from same email per hour ──────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.contactFormSubmission.count({
      where: { siteId, email, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 5) {
      try {
        EventBus.emit("form.failed", {
          siteId,
          data: {
            message: "Submission frequency limit reached (max 5 per hour)",
            payload: { name, email },
          },
        });
      } catch (e) {}
      return NextResponse.json(
        {
          success: false,
          error: "Too many submissions. Please try again later.",
        },
        { status: 429 },
      );
    }

    const submission = await prisma.contactFormSubmission.create({
      data: { siteId, name, email, phone, message, status: "new" },
    });

    let lead = null;
    // Create a Lead record for every contact form submission so it flows into the CRM Leads dashboard.
    lead = await prisma.lead.create({
      data: {
        siteId,
        name,
        email,
        phone,
        serviceInterest: "Contact Form Submission",
        sourcePage: "Contact Page",
        status: "new",
        notes: `Form Message: ${message}`,
      },
    });

    // Sync newsletter subscribers when submission is a newsletter signup
    const isNewsletter =
      message?.toLowerCase().includes("newsletter") ||
      name === "Newsletter Subscriber";
    if (isNewsletter) {
      try {
        const cleanEmail = email.toLowerCase().trim();
        
        // 1. Legacy Newsletter Table sync
        const existing = await prisma.newsletter.findFirst({
          where: { siteId, email: cleanEmail },
        });
        if (!existing) {
          await prisma.newsletter.create({
            data: { siteId, email: cleanEmail, status: "active" },
          });
        } else if (existing.status !== "active") {
          await prisma.newsletter.update({
            where: { id: existing.id },
            data: { status: "active" },
          });
        }

        // 2. CRM Subscriber Table sync (Marketing CRM)
        const { subscriberService } = await import("@/services/subscriber.service");
        await subscriberService.createSubscriber(siteId, {
          email: cleanEmail,
          name: name !== "Newsletter Subscriber" ? name : null,
          status: "active",
          tags: "contact-form-newsletter",
          metadata: { source: "contact-form" }
        });
      } catch (e) {
        console.error("Failed to sync newsletter subscriber:", e);
      }
    }

    // ── Emit events for asynchronous processing (emails & dashboard notifications) ──
    try {
      EventBus.emit("contact_form.submitted", { submission, lead, site });
      if (lead) {
        EventBus.emit("lead.created", { siteId, data: lead });
      }
    } catch (err) {
      console.error("Failed to emit submission events:", err);
    }

    const resPayload = {
      message: "Form submitted successfully",
      submissionId: submission.id,
    };
    if (lead) resPayload.leadId = lead.id;

    return NextResponse.json(apiSuccess(resPayload));
  } catch (err) {
    console.error("POST /api/forms/submit error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: err.message },
      { status: 500 },
    );
  }
}
