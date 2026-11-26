"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { isOwnStoragePath } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "./schemas";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireMember();
  const raw = {
    display_name: String(formData.get("display_name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    city: String(formData.get("city") ?? ""),
    birthday: String(formData.get("birthday") ?? ""),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: raw };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", me.id);
  if (error) return { error: "No s'han pogut desar els canvis.", values: raw };

  revalidatePath("/", "layout");
  return { ok: "Canvis desats.", values: raw };
}

/**
 * Desa la nova foto de perfil o portada (ja pujada a Storage des del
 * navegador) i esborra l'anterior.
 */
export async function setProfileImage(
  kind: "avatar" | "cover",
  path: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireMember();
  if (path !== null && !isOwnStoragePath(path, me.id)) return { ok: false, error: "Imatge no vàlida." };

  const column = kind === "avatar" ? "avatar_path" : "cover_path";
  const previous = me[column];

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(kind === "avatar" ? { avatar_path: path } : { cover_path: path })
    .eq("id", me.id);
  if (error) return { ok: false, error: "No s'ha pogut desar la imatge." };

  if (previous && previous !== path) {
    await supabase.storage.from("avatars").remove([previous]);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
