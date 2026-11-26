"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Marca com a llegides totes les notificacions de l'usuari (la RLS limita a les seves). */
export async function markAllNotificationsRead() {
  await requireMember();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  revalidatePath("/", "layout");
}
