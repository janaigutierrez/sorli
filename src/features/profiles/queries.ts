import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Dades mínimes d'un membre per pintar avatar + nom + enllaç. */
export const PROFILE_SUMMARY = "id, username, display_name, avatar_path" as const;

export type ProfileSummary = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
};

export async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data;
}

/** Tots els membres actius, per ordre alfabètic. */
export async function listMembers(): Promise<ProfileSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_SUMMARY)
    .eq("status", "active")
    .order("display_name");
  return data ?? [];
}

/** Cerca per nom o nom d'usuari (insensible a majúscules). */
export async function searchMembers(query: string) {
  const q = query.trim();
  if (!q) return listMembers();

  // Escapem els comodins de LIKE i els caràcters especials del filtre `or`.
  const safe = q.replace(/[%_\\]/g, (c) => `\\${c}`).replace(/[,()]/g, " ");
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(`${PROFILE_SUMMARY}, city`)
    .eq("status", "active")
    .or(`display_name.ilike.%${safe}%,username.ilike.%${safe}%`)
    .order("display_name")
    .limit(50);
  return data ?? [];
}
