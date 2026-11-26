import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * ⚠️ Client amb clau secreta: SALTA LES RLS.
 * Només per a operacions que ho requereixen explícitament
 * (crear usuari en el registre per invitació, eliminar compte).
 * Sempre després d'haver validat permisos al servidor.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
