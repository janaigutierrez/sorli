import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Opcions de les cookies de sessió.
 * - `secure` en producció: només viatgen per HTTPS.
 * - `sameSite: lax`: no s'envien en peticions creuades (protecció CSRF bàsica).
 * - `httpOnly` ha de ser false: el client del navegador necessita la sessió
 *   per pujar imatges directament a Storage (les RLS continuen protegint).
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};
