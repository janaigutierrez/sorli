export type MediaBucket = "avatars" | "photos";

/**
 * URL interna d'una imatge de Storage. Els buckets són privats: la ruta
 * /media comprova la sessió i redirigeix a una URL signada temporal.
 */
export function mediaUrl(bucket: MediaBucket, path: string | null | undefined) {
  if (!path) return null;
  return `/media/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Ruta vàlida dins la carpeta d'un usuari: <uid>/<uuid>.<ext> */
export function isOwnStoragePath(path: string, userId: string) {
  return new RegExp(
    `^${userId}/[0-9a-f-]{36}(-[a-z]+)?\\.(webp|jpg|jpeg|png|gif)$`,
    "i",
  ).test(path);
}
