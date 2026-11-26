import { z } from "zod";

const httpUrl = (msg: string) =>
  z
    .string()
    .trim()
    .max(2000, { error: "Enllaç massa llarg." })
    .pipe(z.url({ protocol: /^https?$/, error: msg }));

const optional = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal("").transform(() => null), schema]).nullable();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Màxim ${max} caràcters.` })
    .transform((v) => (v === "" ? null : v));

const imagePath = z.string().nullable();

export const wishSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, { error: "Posa-li un nom." }).max(120, { error: "Màxim 120 caràcters." }),
  description: optionalText(500),
  url: optional(httpUrl("Ha de ser un enllaç vàlid (https://…).")),
  imagePath,
});

export const songSchema = z.object({
  title: z.string().trim().min(1, { error: "Falta el títol." }).max(150),
  artist: z.string().trim().min(1, { error: "Falta l'artista." }).max(150),
  url: httpUrl("Ha de ser un enllaç vàlid (Spotify, YouTube…)."),
  coverPath: imagePath,
});

export const playlistSchema = z.object({
  title: z.string().trim().min(1, { error: "Posa-li un títol." }).max(120),
  description: optionalText(500),
  spotifyUrl: z
    .string()
    .trim()
    .regex(/^https:\/\/open\.spotify\.com\/(intl-[a-z]{2}\/)?playlist\/[A-Za-z0-9]{10,40}/, {
      error: "Ha de ser l'enllaç d'una playlist de Spotify (open.spotify.com/playlist/…).",
    }),
});
