import "server-only";
import { createClient } from "@/lib/supabase/server";

export type GalleryPhoto = {
  id: string;
  storage_path: string;
  created_at: string;
  post_id: string | null;
};

/**
 * Galeria d'un membre: totes les fotos que ha pujat ell (directament o
 * dins publicacions, també als murs d'altres). Les que altres pengen al
 * seu mur NO hi surten (decisió del PRD).
 */
export async function getGallery(ownerId: string): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .select("id, storage_path, created_at, post_photos(post_id)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(500);

  return (data ?? []).map((p) => ({
    id: p.id,
    storage_path: p.storage_path,
    created_at: p.created_at,
    post_id: p.post_photos[0]?.post_id ?? null,
  }));
}
