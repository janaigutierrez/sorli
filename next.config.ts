import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Content Security Policy: què pot carregar la pàgina i d'on.
 * - connect-src: el navegador només parla amb el nostre domini i Supabase
 *   (pujada d'imatges a Storage).
 * - img-src https: les imatges privades redirigeixen a URLs signades de
 *   Supabase, i les portades venen de Spotify / YouTube.
 * - frame-src: només el reproductor oficial de Spotify.
 * - frame-ancestors 'none': ningú pot incrustar Sorli (anti-clickjacking).
 */
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  connect-src 'self' ${supabaseUrl};
  frame-src https://open.spotify.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${isDev ? "" : "upgrade-insecure-requests;"}
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Xarxa privada: que cap cercador indexi res
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  // Cache Components desactivat a propòsit: a Sorli gairebé tot depèn de la
  // sessió (cookies), i amb 5 usuaris no compensa la complexitat de
  // <Suspense> + "use cache: private" a cada pàgina. Es pot activar més endavant.
  cacheComponents: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
