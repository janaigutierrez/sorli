"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();

// ─── Invitacions ───────────────────────────────────────────────
const invitationSchema = z.object({
  note: z.string().trim().max(200, { error: "Màxim 200 caràcters." }),
  email: z.union([
    z.literal(""),
    z.string().trim().toLowerCase().pipe(z.email({ error: "Correu no vàlid." })),
  ]),
  role: z.enum(["member", "admin"]),
  days: z.coerce.number().int().min(1).max(30),
});

/**
 * Crea una invitació d'un sol ús. El token només existeix aquí, en clar,
 * un instant: a la BD només en guardem el hash. L'enllaç es mostra UNA vegada.
 */
export async function createInvitation(
  input: z.input<typeof invitationSchema>,
): Promise<ActionResult<{ link: string }>> {
  const me = await requireAdmin();
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dades no vàlides.");

  const token = randomBytes(32).toString("base64url"); // 256 bits
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  const { note, email, role, days } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("invitations").insert({
    token_hash: tokenHash,
    note: note || null,
    email: email || null,
    role,
    created_by: me.id,
    expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
  });
  if (error) return fail("No s'ha pogut crear la invitació.");

  revalidatePath("/admin", "layout");
  return { ok: true, data: { link: `${publicEnv.NEXT_PUBLIC_SITE_URL}/registre/${token}` } };
}

export async function revokeInvitation(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!uuid.safeParse(id).success) return fail("Invitació no vàlida.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("used_at", null)
    .is("revoked_at", null)
    .select("id");
  if (error || !data?.length) return fail("No s'ha pogut revocar (potser ja s'ha fet servir).");

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ─── Membres ───────────────────────────────────────────────────
/** Converteix els errors de les funcions SQL (ja en català) en missatges per a l'usuari. */
function dbError(error: { message: string; code?: string } | null, fallback: string) {
  return error?.code === "42501" || error?.code === "P0002" ? error.message : fallback;
}

export async function setMemberStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<ActionResult> {
  await requireAdmin();
  if (!uuid.safeParse(userId).success) return fail("Membre no vàlid.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_member_status", { p_user: userId, p_status: status });
  if (error) return fail(dbError(error, "No s'ha pogut canviar l'estat."));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setMemberRole(userId: string, role: "admin" | "member"): Promise<ActionResult> {
  await requireAdmin();
  if (!uuid.safeParse(userId).success) return fail("Membre no vàlid.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_member_role", { p_user: userId, p_role: role });
  if (error) return fail(dbError(error, "No s'ha pogut canviar el rol."));

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Elimina un compte i tot el seu contingut (fitxers inclosos). Irreversible. */
export async function deleteMember(userId: string, confirmUsername: string): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!uuid.safeParse(userId).success) return fail("Membre no vàlid.");
  if (userId === me.id) return fail("Per eliminar el teu compte, fes-ho des d'Ajustos.");

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  if (!target) return fail("Membre no trobat.");
  if (confirmUsername.trim().toLowerCase() !== target.username) {
    return fail(`Per confirmar, escriu exactament «${target.username}».`);
  }

  // 1) Fitxers (l'admin pot esborrar a qualsevol carpeta dels buckets de Sorli).
  for (const bucket of ["avatars", "photos"] as const) {
    const { data: files } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
    if (files?.length) {
      await supabase.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
    }
  }

  // 2) Compte → cascada a tot el seu contingut.
  const { error } = await supabase.rpc("admin_delete_member", { p_user: userId });
  if (error) return fail(dbError(error, "No s'ha pogut eliminar el compte."));

  revalidatePath("/", "layout");
  return { ok: true };
}
