import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type WishItem = Tables<"wishlist_items">;
export type Song = Tables<"songs">;
export type Playlist = Tables<"playlists">;

export async function getWishlist(ownerId: string): Promise<WishItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMusic(ownerId: string) {
  const supabase = await createClient();
  const [songs, playlists] = await Promise.all([
    supabase.from("songs").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("playlists").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
  ]);
  return { songs: songs.data ?? [], playlists: playlists.data ?? [] };
}
