import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import { cookieOptions } from "./cookie-options";
import type { Database } from "@/types/database";

/** Client per a Client Components. Només clau publicable: tot passa per RLS. */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookieOptions },
  );
}
