"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { isOwnStoragePath } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

const uuid = z.uuid();

// ─── Publicar ──────────────────────────────────────────────────
const createPostSchema = z.object({
  wallOwnerId: uuid,
  body: z.string().max(5000, { error: "Màxim 5.000 caràcters." }),
  photoPaths: z.array(z.string()).max(10, { error: "Màxim 10 fotos per publicació." }),
});

export async function createPost(input: z.input<typeof createPostSchema>): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dades no vàlides.");

  const { wallOwnerId, body, photoPaths } = parsed.data;
  if (!body.trim() && photoPaths.length === 0) return fail("Escriu alguna cosa o afegeix una foto.");
  if (!photoPaths.every((p) => isOwnStoragePath(p, me.id))) return fail("Fotos no vàlides.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_post", {
    p_wall_owner_id: wallOwnerId,
    p_body: body,
    p_photo_paths: photoPaths,
  });
  if (error) return fail("No s'ha pogut publicar. Torna-ho a provar.");

  revalidatePath("/", "layout");
  return { ok: true };
}

// ─── Esborrar publicació (autor, propietari del mur o admin: ho decideix la RLS) ─
export async function deletePost(postId: string): Promise<ActionResult> {
  await requireMember();
  if (!uuid.safeParse(postId).success) return fail("Publicació no vàlida.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", postId).select("id");
  if (error || !data?.length) return fail("No tens permís per esborrar aquesta publicació.");

  revalidatePath("/", "layout");
  return { ok: true };
}

// ─── M'agrada ──────────────────────────────────────────────────
export async function setLike(postId: string, liked: boolean): Promise<ActionResult> {
  const me = await requireMember();
  if (!uuid.safeParse(postId).success) return fail("Publicació no vàlida.");

  const supabase = await createClient();
  const { error } = liked
    ? await supabase.from("likes").upsert(
        { post_id: postId, user_id: me.id },
        { onConflict: "post_id,user_id", ignoreDuplicates: true },
      )
    : await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", me.id);

  if (error) return fail("No s'ha pogut desar el m'agrada.");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─── Comentaris ────────────────────────────────────────────────
const commentSchema = z.object({
  postId: uuid,
  parentId: uuid.nullable(),
  body: z
    .string()
    .trim()
    .min(1, { error: "El comentari és buit." })
    .max(2000, { error: "Màxim 2.000 caràcters." }),
});

export async function addComment(input: z.input<typeof commentSchema>): Promise<ActionResult> {
  const me = await requireMember();
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Comentari no vàlid.");

  const { postId, parentId, body } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, parent_id: parentId, author_id: me.id, body });

  if (error) return fail("No s'ha pogut comentar. Torna-ho a provar.");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  await requireMember();
  if (!uuid.safeParse(commentId).success) return fail("Comentari no vàlid.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("comments").delete().eq("id", commentId).select("id");
  if (error || !data?.length) return fail("No tens permís per esborrar aquest comentari.");

  revalidatePath("/", "layout");
  return { ok: true };
}
