import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Introdueix un correu electrònic vàlid." }));

const password = z
  .string()
  .min(8, { error: "La contrasenya ha de tenir com a mínim 8 caràcters." })
  .max(72, { error: "La contrasenya és massa llarga (màxim 72 caràcters)." });

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.]{3,20}$/, {
    error: "Entre 3 i 20 caràcters: lletres minúscules, números, punt o guió baix.",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Introdueix la contrasenya." }),
  next: z.string().optional(),
});

export const registerSchema = z
  .object({
    token: z.string().min(20, { error: "Invitació no vàlida." }),
    email,
    username: usernameSchema,
    password,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    error: "Les contrasenyes no coincideixen.",
    path: ["passwordConfirm"],
  });

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, passwordConfirm: z.string() })
  .refine((d) => d.password === d.passwordConfirm, {
    error: "Les contrasenyes no coincideixen.",
    path: ["passwordConfirm"],
  });
