import "server-only";

/**
 * Metadades d'enllaços musicals via oEmbed (sense connectar comptes).
 * Només consultem proveïdors d'una llista tancada: mai una URL arbitrària
 * (així evitem que el servidor es pugui fer servir per accedir a altres llocs).
 */
export type LinkPreview = {
  provider: "spotify" | "youtube";
  title: string | null;
  author: string | null;
  thumbnail: string | null;
};

const PROVIDERS = [
  {
    name: "spotify" as const,
    match: /^https:\/\/open\.spotify\.com\/(intl-[a-z]{2}\/)?(track|album|playlist|artist|episode)\/[A-Za-z0-9]+/,
    endpoint: (url: string) => `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
  },
  {
    name: "youtube" as const,
    match: /^https:\/\/(www\.|music\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{6,}/,
    endpoint: (url: string) =>
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.replace("music.youtube.com", "www.youtube.com"))}`,
  },
];

/** Treu paràmetres de seguiment (?si=…) i normalitza l'enllaç. */
export function cleanMusicUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    if (u.hostname === "open.spotify.com") u.search = "";
    return u.toString();
  } catch {
    return raw.trim();
  }
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview | null> {
  const url = cleanMusicUrl(rawUrl);
  const provider = PROVIDERS.find((p) => p.match.test(url));
  if (!provider) return null;

  try {
    const res = await fetch(provider.endpoint(url), {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const thumb = str(data.thumbnail_url);
    return {
      provider: provider.name,
      title: str(data.title),
      author: str(data.author_name),
      thumbnail: thumb && /^https:\/\//.test(thumb) ? thumb : null,
    };
  } catch {
    return null;
  }
}

/** ID d'una playlist de Spotify a partir de l'enllaç (per a l'embed oficial). */
export function spotifyPlaylistId(url: string) {
  return url.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]+)/)?.[1] ?? null;
}
