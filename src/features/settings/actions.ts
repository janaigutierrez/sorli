"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

const password = z
  .string()
  .min(8, { error: "Mínim 8 caràcters." })
  .max(72, { error: "Màxim 72 caràcters." });

// ─── Canvi de correu ───────────────────────────────────────────
export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().pipe(z.email({ error: "Correu no vàlid." })) })
    .safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/ajustos` },
  );
  if (error) {
    if (error.code === "email_exists") return { fieldErrors: { email: ["Aquest correu ja està en ús."] } };
    if (error.status === 429) return { error: "Massa intents. Espera uns minuts." };
    return { error: "No s'ha pogut canviar el correu." };
  }
  return {
    ok: "T'hem enviat un enllaç de confirmació. El canvi s'aplicarà quan el confirmis (pot ser que calgui confirmar-lo des de l'adreça antiga i la nova).",
  };
}

// ─── Canvi de contrasenya (demana l'actual) ─────────────────────
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const parsed = z
    .object({ current: z.string().min(1, { error: "Escriu la contrasenya actual." }), password, passwordConfirm: z.string() })
    .refine((d) => d.password === d.passwordConfirm, {
      error: "Les contrasenyes no coincideixen.",
      path: ["passwordConfirm"],
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return { error: "Sessió no vàlida. Torna a entrar." };

  // Verifiquem la contrasenya actual abans de canviar-la.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.current,
  });
  if (authError) return { fieldErrors: { current: ["La contrasenya actual no és correcta."] } };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: ["Ha de ser diferent de l'actual."] } };
    return { error: "No s'ha pogut canviar la contrasenya." };
  }
  return { ok: "Contrasenya canviada." };
}

// ─── Eliminar compte ───────────────────────────────────────────
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireMember();
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== me.username) {
    return { fieldErrors: { confirm: [`Escriu «${me.username}» per confirmar.`] } };
  }

  const supabase = await createClient();

  // 1) Esborra els fitxers de les carpetes de l'usuari (la BD no pot fer-ho).
  for (const bucket of ["avatars", "photos"] as const) {
    const { data: files } = await supabase.storage.from(bucket).list(me.id, { limit: 1000 });
    if (files?.length) {
      await supabase.storage.from(bucket).remove(files.map((f) => `${me.id}/${f.name}`));
    }
  }

  // 2) Esborra l'usuari → cascada a perfil, publicacions, comentaris, m'agrades…
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "No s'ha pogut eliminar el compte. Torna-ho a provar." };

  await supabase.auth.signOut();
  redirect("/login?error=eliminat");
}
