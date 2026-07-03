import { z } from "zod";

export const CtaConfigSchema = z.object({
  main: z
    .object({
      text: z.string().optional(),
      link: z.string().optional(),
    })
    .optional(),

  floatingButtons: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        link: z.string().optional(),
      }),
    )
    .optional(),

  popups: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string().optional(),
      }),
    )
    .optional(),
});
