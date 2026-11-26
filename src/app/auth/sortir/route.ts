import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Tanca la sessió des d'on no es poden escriure cookies (Server Components),
 * p. ex. quan es detecta que el compte està suspès.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const motiu = request.nextUrl.searchParams.get("motiu");
  const error = motiu === "suspes" ? "suspes" : "sortit";
  return NextResponse.redirect(`${request.nextUrl.origin}/login?error=${error}`);
}
