import { z } from "zod";

const optionalText = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, { error: msg })
    .transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, { error: "El nom no pot estar buit." })
    .max(60, { error: "Màxim 60 caràcters." }),
  bio: optionalText(500, "Màxim 500 caràcters."),
  city: optionalText(80, "Màxim 80 caràcters."),
  birthday: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), {
      error: "Data no vàlida.",
    })
    .refine((v) => v === "" || (v >= "1900-01-01" && v <= new Date().toISOString().slice(0, 10)), {
      error: "Data fora de rang.",
    })
    .transform((v) => (v === "" ? null : v)),
});
