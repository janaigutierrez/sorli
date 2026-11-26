import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProfileSummary } from "@/features/profiles/queries";

export const PAGE_SIZE = 20;

const AUTHOR = "id, username, display_name, avatar_path";

const POST_SELECT = `
  id, body, created_at, author_id, wall_owner_id,
  author:profiles!posts_author_id_fkey(${AUTHOR}),
  wall_owner:profiles!posts_wall_owner_id_fkey(${AUTHOR}),
  post_photos(position, photo:photos(id, storage_path)),
  likes(user_id, user:profiles(username, display_name)),
  comments(id, body, created_at, parent_id, author_id, author:profiles(${AUTHOR}))
`;

export type CommentView = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  author_id: string;
  author: ProfileSummary;
};

export type PostView = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  wall_owner_id: string;
  author: ProfileSummary;
  wall_owner: ProfileSummary;
  photos: { id: string; storage_path: string }[];
  likes: { user_id: string; username: string; display_name: string }[];
  comments: CommentView[];
};

type RawPost = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  wall_owner_id: string;
  author: ProfileSummary | null;
  wall_owner: ProfileSummary | null;
  post_photos: { position: number; photo: { id: string; storage_path: string } | null }[];
  likes: { user_id: string; user: { username: string; display_name: string } | null }[];
  comments: (Omit<CommentView, "author"> & { author: ProfileSummary | null })[];
};

function toView(p: RawPost): PostView | null {
  if (!p.author || !p.wall_owner) return null;
  return {
    id: p.id,
    body: p.body,
    created_at: p.created_at,
    author_id: p.author_id,
    wall_owner_id: p.wall_owner_id,
    author: p.author,
    wall_owner: p.wall_owner,
    photos: [...p.post_photos]
      .sort((a, b) => a.position - b.position)
      .flatMap((pp) => (pp.photo ? [pp.photo] : [])),
    likes: p.likes.flatMap((l) => (l.user ? [{ user_id: l.user_id, ...l.user }] : [])),
    comments: p.comments
      .flatMap((c) => (c.author ? [{ ...c, author: c.author }] : []))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

/**
 * Publicacions en ordre cronològic invers.
 * - sense `wallOwnerId`: feed general (tots els murs)
 * - amb `wallOwnerId`: el mur d'un membre
 * Paginació per cursor (`before` = created_at de l'última que s'ha vist).
 */
export async function getPosts({
  wallOwnerId,
  before,
}: { wallOwnerId?: string; before?: string } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (wallOwnerId) query = query.eq("wall_owner_id", wallOwnerId);
  if (before) query = query.lt("created_at", before);

  const { data, error } = await query.returns<RawPost[]>();
  if (error) throw new Error(`No s'han pogut carregar les publicacions: ${error.message}`);

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const posts = rows.slice(0, PAGE_SIZE).flatMap((p) => toView(p) ?? []);
  return { posts, nextCursor: hasMore ? posts.at(-1)?.created_at : undefined };
}

export async function getPost(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .returns<RawPost[]>()
    .maybeSingle();
  return data ? toView(data) : null;
}
