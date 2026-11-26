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
    // L'oEmbed de Spotify no inclou l'artista: per a cançons, el llegim de la pàgina.
    const author =
      str(data.author_name) ?? (provider.name === "spotify" ? await fetchSpotifyArtist(url) : null);
    return {
      provider: provider.name,
      title: str(data.title),
      author,
      thumbnail: thumb && /^https:\/\//.test(thumb) ? thumb : null,
    };
  } catch {
    return null;
  }
}

const SPOTIFY_TRACK = /^https:\/\/open\.spotify\.com\/(intl-[a-z]{2}\/)?track\/[A-Za-z0-9]+$/;

/**
 * Artista d'una cançó de Spotify, llegit de les etiquetes <meta> de la seva
 * pàgina pública (`music:musician_description`, una per artista).
 * Només es consulta open.spotify.com/track/… (mai una URL arbitrària).
 */
export async function fetchSpotifyArtist(trackUrl: string): Promise<string | null> {
  if (!SPOTIFY_TRACK.test(trackUrl)) return null;
  try {
    const res = await fetch(trackUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Sorli/1.0)", "Accept-Language": "ca,es;q=0.8,en;q=0.5" },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    return parseSpotifyArtist(await res.text());
  } catch {
    return null;
  }
}

/** Extreu l'artista (o artistes) de l'HTML d'una pàgina de cançó de Spotify. */
export function parseSpotifyArtist(html: string): string | null {
  const metas = [...html.matchAll(/<meta\s[^>]*>/gi)].map((m) => {
    const tag = m[0];
    const key = tag.match(/\b(?:name|property)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
    return { key, content: content ? decodeEntities(content).trim() : "" };
  });

  const artists = metas
    .filter((m) => m.key === "music:musician_description" && m.content)
    .map((m) => m.content);
  if (artists.length) return [...new Set(artists)].join(", ").slice(0, 150);

  // Pla B: og:description = "Artista · Àlbum · Song · Any"
  const og = metas.find((m) => m.key === "og:description")?.content;
  const first = og?.split(" · ")[0]?.trim();
  return first ? first.slice(0, 150) : null;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

/** ID d'una playlist de Spotify a partir de l'enllaç (per a l'embed oficial). */
export function spotifyPlaylistId(url: string) {
  return url.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]+)/)?.[1] ?? null;
}
