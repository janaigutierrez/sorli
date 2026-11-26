import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { cookieOptions } from "./cookie-options";

/** Rutes accessibles sense sessió. Tota la resta requereix estar autenticat. */
const PUBLIC_PREFIXES = ["/login", "/registre", "/recuperar", "/auth"];
/** Només en desenvolupament: guia d'estil del sistema de disseny. */
const DEV_PREFIXES = process.env.NODE_ENV === "production" ? [] : ["/disseny"];

function isPublic(pathname: string) {
  return [...PUBLIC_PREFIXES, ...DEV_PREFIXES].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Refresca la sessió de Supabase a cada petició i redirigeix a /login
 * si no n'hi ha. És una primera barrera (UX): la seguretat real
 * són les RLS i les comprovacions a cada Server Action.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: no posar codi entre createServerClient i getClaims().
  // getClaims() valida el JWT (no es refia de la cookie sense verificar).
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/inici";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
