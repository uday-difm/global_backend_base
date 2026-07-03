// global_backend/src/lib/validators/section.js
import { z } from "zod";

/**
 * Section validators for known section types.
 * Export validateByType(type, payload) which throws ZodError on validation failure.
 *
 * Known types: HERO, TEXT_BLOCK
 */

// Reusable CTA schema
const CtaSchema = z
  .object({
    text: z.string().nonempty("CTA text is required"),
    url: z.string().nonempty("CTA url is required"),
  })
  .partial({ url: false });

const UrlOrRelative = z
  .string()
  .refine(
    (val) =>
      val === "" ||
      val.startsWith("/") ||
      val.startsWith(".") ||
      /^(https?:)?\/\//.test(val),
    {
      message: "Must be a valid absolute URL, relative path, or empty",
    },
  );

// HERO content schema
const HeroContentSchema = z
  .object({
    title: z.string().nonempty("Hero title is required"),
    subtitle: z.string().optional(),
    backgroundMediaId: z.string().optional(),
    backgroundUrl: UrlOrRelative.optional(),
    overlayColor: z.string().optional(),
    primaryButton: CtaSchema.optional(),
    secondaryButton: CtaSchema.optional(),
    alignment: z.enum(["left", "center", "right"]).optional(),
    heading: z.string().optional(),
    subheading: z.string().optional(),
    textColor: z.string().optional(),
    overlay: z.any().optional(),
    backgroundImage: z.any().optional(),
  })
  .passthrough();

// TEXT_BLOCK content schema
const TextBlockContentSchema = z
  .object({
    title: z.string().optional(),
    body: z.string().optional(),
    imageMediaId: z.string().optional(),
    imageUrl: UrlOrRelative.optional(),
    imagePosition: z.enum(["left", "right", "top"]).optional(),
    cta: CtaSchema.optional(),
    heading: z.string().optional(),
    bgColor: z.string().optional(),
    textColor: z.string().optional(),
    showImage: z.boolean().optional(),
    layout: z.string().optional(),
  })
  .passthrough();

// LEGAL_CONTENT content schema
const LegalContentSchema = z
  .object({
    documentType: z.enum([
      "privacy",
      "terms",
      "cookies",
      "disclaimer",
      "refund",
    ]),
  })
  .passthrough();

const TypeSchemaMap = {
  HERO: HeroContentSchema,
  TEXT_BLOCK: TextBlockContentSchema,
  LEGAL_CONTENT: LegalContentSchema,
};

export function validateByType(type, payload) {
  if (!type) {
    throw new z.ZodError([
      {
        path: ["type"],
        message: "Section type is required",
        code: z.ZodIssueCode.custom,
      },
    ]);
  }

  const upper = String(type).toUpperCase();
  const schema = TypeSchemaMap[upper];
  if (!schema) {
    // unknown type: accept as-is
    return true;
  }

  const content = payload?.content ?? {};
  schema.parse(content);
  return true;
}

export function tryValidateByType(type, payload) {
  try {
    validateByType(type, payload);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}
