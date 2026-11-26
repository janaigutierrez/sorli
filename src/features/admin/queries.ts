import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ProfileSummary } from "@/features/profiles/queries";

export type InvitationStatus = "pendent" | "usada" | "caducada" | "revocada";

export type InvitationView = Tables<"invitations"> & {
  status: InvitationStatus;
  usedBy: ProfileSummary | null;
};

export function invitationStatus(i: Tables<"invitations">): InvitationStatus {
  if (i.revoked_at) return "revocada";
  if (i.used_at) return "usada";
  if (new Date(i.expires_at) <= new Date()) return "caducada";
  return "pendent";
}

/** Totes les invitacions (la RLS ja limita a admins). */
export async function listInvitations(): Promise<InvitationView[]> {
  const supabase = await createClient();
  const [{ data: invitations }, { data: profiles }] = await Promise.all([
    supabase.from("invitations").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, username, display_name, avatar_path"),
  ]);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return (invitations ?? []).map((i) => ({
    ...i,
    status: invitationStatus(i),
    usedBy: i.used_by ? (byId.get(i.used_by) ?? null) : null,
  }));
}

export async function adminListMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_members");
  if (error) throw new Error(`No s'han pogut carregar els membres: ${error.message}`);
  return data ?? [];
}

export type RecentComment = {
  id: string;
  body: string;
  created_at: string;
  post_id: string;
  author: ProfileSummary | null;
};

/** Últims comentaris de tota la comunitat (per moderar). */
export async function recentComments(limit = 40): Promise<RecentComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, body, created_at, post_id, author:profiles(id, username, display_name, avatar_path)")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RecentComment[]>();
  return data ?? [];
}
