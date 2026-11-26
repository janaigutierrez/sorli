/**
 * Evita redireccions obertes: només accepta rutes internes ("/algo"),
 * mai "//domini.com" ni URLs absolutes.
 */
export function safeNext(next: unknown, fallback = "/inici"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
