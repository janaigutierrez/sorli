"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import type { FormState } from "@/lib/form-state";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetRequestSchema,
} from "./schemas";

const RATE_LIMIT_MSG = "Massa intents. Espera uns minuts i torna-ho a provar.";

function fields(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
}

// ─── Login ─────────────────────────────────────────────────────
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = fields(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { email: raw.email ?? "" },
    };
  }

  const { email, password, next } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg =
      error.code === "email_not_confirmed"
        ? "Encara no has confirmat el correu. Revisa la safata d'entrada."
        : error.status === 429
          ? RATE_LIMIT_MSG
          : "El correu o la contrasenya no són correctes.";
    return { error: msg, values: { email } };
  }

  // Un compte suspès pot tenir credencials vàlides: el fem fora.
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.status !== "active") {
    await supabase.auth.signOut();
    return { error: "Aquest compte està suspès. Parla amb l'administrador." };
  }

  redirect(safeNext(next));
}

// ─── Registre per invitació ────────────────────────────────────
const INVITATION_ERRORS: Record<string, string> = {
  invalid: "Aquesta invitació no és vàlida, ja s'ha fet servir o ha caducat.",
  used: "Aquesta invitació ja s'ha fet servir. Si és teva, entra amb el teu correu.",
  expired: "Aquesta invitació ha caducat. Demana'n una de nova.",
  revoked: "Aquesta invitació s'ha anul·lat. Demana'n una de nova.",
  email_mismatch: "Aquesta invitació és per a una altra adreça de correu.",
};

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = fields(formData);
  const values = { email: raw.email ?? "", username: raw.username ?? "" };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { token, email, username, password } = parsed.data;
  const supabase = await createClient();

  // 1) Validació prèvia per donar errors clars. (La validació definitiva,
  //    a prova de curses, la fa el trigger de Postgres en crear l'usuari.)
  const { data: status, error: rpcError } = await supabase.rpc("check_invitation", {
    p_token: token,
    p_email: email,
    p_username: username,
  });

  if (rpcError) return { error: "No s'ha pogut validar la invitació. Torna-ho a provar.", values };
  if (status === "username_taken") {
    return { fieldErrors: { username: ["Aquest nom d'usuari ja existeix."] }, values };
  }
  if (status !== "ok") {
    return { error: INVITATION_ERRORS[status] ?? INVITATION_ERRORS.invalid, values };
  }

  // 2) Alta a Supabase Auth. El token viatja a les metadades; el trigger
  //    el valida, consumeix la invitació, crea el perfil i l'esborra.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { invitation_token: token, username },
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/inici`,
    },
  });

  if (error) {
    if (error.status === 429) return { error: RATE_LIMIT_MSG, values };
    if (error.code === "user_already_exists") {
      return { error: "Aquest correu ja té un compte. Prova d'entrar.", values };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: ["La contrasenya és massa feble."] }, values };
    }
    if (error.code === "signup_disabled") {
      // Configuració de Supabase: "Allow new users to sign up" ha d'estar ACTIVAT
      // (qui decideix si es pot entrar és el trigger d'invitacions, no aquest interruptor).
      console.error("[registre] Supabase té els registres desactivats (signup_disabled)");
      return {
        error: "Ara mateix el registre està desactivat a Sorli. Avisa l'administrador (no és culpa de la teva invitació).",
        values,
      };
    }
    console.error("[registre] signUp ha fallat:", error.status, error.code, error.message);
    // Si la invitació s'ha consumit entremig, el trigger rebutja l'alta: ho tornem a comprovar.
    const { data: recheck } = await supabase.rpc("check_invitation", { p_token: token });
    if (recheck && recheck !== "ok") {
      return { error: INVITATION_ERRORS[recheck] ?? INVITATION_ERRORS.invalid, values };
    }
    return {
      error: `No s'ha pogut crear el compte. Torna-ho a provar d'aquí a un moment (codi: ${error.code ?? error.status ?? "desconegut"}).`,
      values,
    };
  }

  // Amb la confirmació de correu activa, Supabase "simula" èxit si el correu
  // ja existeix, però sense identitats.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "Aquest correu ja té un compte. Prova d'entrar.", values };
  }

  if (data.session) redirect("/inici");

  return {
    ok: "Compte creat! T'hem enviat un correu per confirmar l'adreça. Obre l'enllaç i ja seràs a Sorli.",
  };
}

// ─── Recuperació de contrasenya ────────────────────────────────
export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = fields(formData);
  const parsed = resetRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { email: raw.email ?? "" } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/nova-contrasenya`,
  });

  if (error?.status === 429) return { error: RATE_LIMIT_MSG };

  // Mateixa resposta tant si el correu existeix com si no (no revelem membres).
  return {
    ok: "Si aquest correu és d'un membre de Sorli, rebràs un enllaç per canviar la contrasenya.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return { error: "L'enllaç ha caducat. Torna a demanar el canvi de contrasenya." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { fieldErrors: { password: ["Ha de ser diferent de l'actual."] } };
    }
    return { error: "No s'ha pogut canviar la contrasenya. Torna-ho a provar." };
  }

  redirect("/inici");
}

// ─── Tancar sessió ─────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
