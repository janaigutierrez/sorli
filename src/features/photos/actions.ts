"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, type ActionResult } from "@/lib/action-result";
import { requireMember } from "@/lib/auth";
import { isOwnStoragePath } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

/** Registra a la galeria fotos ja pujades a Storage des del navegador. */
export async function addGalleryPhotos(paths: string[]): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = z.array(z.string()).min(1).max(20).safeParse(paths);
  if (!parsed.success) return fail("Pots pujar entre 1 i 20 fotos alhora.");
  if (!parsed.data.every((p) => isOwnStoragePath(p, me.id))) return fail("Fotos no vàlides.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("photos")
    .insert(parsed.data.map((storage_path) => ({ owner_id: me.id, storage_path })));
  if (error) return fail("No s'han pogut desar les fotos.");

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Esborra una foto (propietari o admin; ho decideix la RLS).
 * Si era en una publicació, desapareix també d'allà.
 */
export async function deletePhoto(photoId: string): Promise<ActionResult> {
  await requireMember();
  if (!z.uuid().safeParse(photoId).success) return fail("Foto no vàlida.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .select("storage_path");
  if (error || !data?.length) return fail("No tens permís per esborrar aquesta foto.");

  await supabase.storage.from("photos").remove(data.map((d) => d.storage_path));
  revalidatePath("/", "layout");
  return { ok: true };
}
