import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";
import type { ProfileSummary } from "@/features/profiles/queries";

export type NotificationView = {
  id: string;
  type: Enums<"notification_type">;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: ProfileSummary | null;
};

/** Nombre de notificacions sense llegir (per a la capçalera). */
export const getUnreadCount = cache(async () => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
});

export async function getNotifications(limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select(
      "id, type, post_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_path)",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<NotificationView[]>();
  return data ?? [];
}
