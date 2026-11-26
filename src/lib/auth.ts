import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Perfil de l'usuari autenticat (o null).
 * `cache` fa que només es consulti una vegada per petició,
 * encara que el cridin el layout i la pàgina alhora.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return profile;
});

/** Per a pàgines de membres. Redirigeix si no hi ha sessió o el compte està suspès. */
export async function requireMember(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/auth/sortir?motiu=suspes");
  return profile;
}

/** Per a pàgines d'administració. Un no-admin veu un 404 (no revelem que existeix). */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireMember();
  if (profile.role !== "admin") notFound();
  return profile;
}
