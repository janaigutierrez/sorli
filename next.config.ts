import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components desactivat a propòsit: a Sorli gairebé tot depèn de la
  // sessió (cookies), i amb 5 usuaris no compensa la complexitat de
  // <Suspense> + "use cache: private" a cada pàgina. Es pot activar més endavant.
  cacheComponents: false,
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
