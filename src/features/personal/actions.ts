"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, type ActionResult } from "@/lib/action-result";
import { requireMember } from "@/lib/auth";
import { isOwnStoragePath } from "@/lib/media";
import { cleanMusicUrl, fetchLinkPreview, type LinkPreview } from "@/lib/oembed";
import { createClient } from "@/lib/supabase/server";
import { playlistSchema, songSchema, wishSchema } from "./schemas";

const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Dades no vàlides.";

async function removeFiles(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => Boolean(p));
  if (list.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from("photos").remove(list);
}

// ─── Wishlist ──────────────────────────────────────────────────
export async function saveWish(input: z.input<typeof wishSchema>): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = wishSchema.safeParse(input);
  if (!parsed.success) return fail(firstError(parsed.error));
  const { id, name, description, url, imagePath } = parsed.data;
  if (imagePath && !isOwnStoragePath(imagePath, me.id)) return fail("Imatge no vàlida.");

  const supabase = await createClient();
  const row = { name, description, url, image_path: imagePath };

  if (id) {
    const { data: prev } = await supabase.from("wishlist_items").select("image_path").eq("id", id).maybeSingle();
    const { data, error } = await supabase.from("wishlist_items").update(row).eq("id", id).select("id");
    if (error || !data?.length) return fail("No s'ha pogut desar.");
    if (prev?.image_path && prev.image_path !== imagePath) await removeFiles([prev.image_path]);
  } else {
    const { error } = await supabase.from("wishlist_items").insert({ ...row, owner_id: me.id });
    if (error) return fail("No s'ha pogut afegir.");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteWish(id: string): Promise<ActionResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return fail("Element no vàlid.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("wishlist_items").delete().eq("id", id).select("image_path");
  if (error || !data?.length) return fail("No tens permís per esborrar-lo.");
  await removeFiles(data.map((d) => d.image_path));
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─── Música ────────────────────────────────────────────────────
/** Suggereix títol, artista i portada a partir d'un enllaç de Spotify o YouTube. */
export async function previewMusicLink(url: string): Promise<ActionResult<LinkPreview | null>> {
  await requireMember();
  if (!z.url({ protocol: /^https$/ }).safeParse(url.trim()).success) return { ok: true, data: null };
  return { ok: true, data: await fetchLinkPreview(url) };
}

export async function addSong(input: z.input<typeof songSchema>): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return fail(firstError(parsed.error));
  const { title, artist, coverPath } = parsed.data;
  if (coverPath && !isOwnStoragePath(coverPath, me.id)) return fail("Imatge no vàlida.");

  const url = cleanMusicUrl(parsed.data.url);
  // Portada automàtica si no se n'ha pujat cap (es resol al servidor, no ens refiem del client).
  const coverUrl = coverPath ? null : ((await fetchLinkPreview(url))?.thumbnail ?? null);

  const supabase = await createClient();
  const { error } = await supabase.from("songs").insert({
    owner_id: me.id,
    title,
    artist,
    url,
    cover_url: coverUrl,
    cover_path: coverPath,
  });
  if (error) return fail("No s'ha pogut afegir la cançó.");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteSong(id: string): Promise<ActionResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return fail("Cançó no vàlida.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("songs").delete().eq("id", id).select("cover_path");
  if (error || !data?.length) return fail("No tens permís per esborrar-la.");
  await removeFiles(data.map((d) => d.cover_path));
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─── Playlists de Spotify ──────────────────────────────────────
export async function addPlaylist(input: z.input<typeof playlistSchema>): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = playlistSchema.safeParse(input);
  if (!parsed.success) return fail(firstError(parsed.error));

  const spotifyUrl = cleanMusicUrl(parsed.data.spotifyUrl);
  const preview = await fetchLinkPreview(spotifyUrl);

  const supabase = await createClient();
  const { error } = await supabase.from("playlists").insert({
    owner_id: me.id,
    title: parsed.data.title,
    description: parsed.data.description,
    spotify_url: spotifyUrl,
    cover_url: preview?.thumbnail ?? null,
  });
  if (error) return fail("No s'ha pogut afegir la playlist.");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePlaylist(id: string): Promise<ActionResult> {
  await requireMember();
  if (!z.uuid().safeParse(id).success) return fail("Playlist no vàlida.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("playlists").delete().eq("id", id).select("id");
  if (error || !data?.length) return fail("No tens permís per esborrar-la.");
  revalidatePath("/", "layout");
  return { ok: true };
}
