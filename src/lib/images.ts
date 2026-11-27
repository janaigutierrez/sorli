"use client";

import { createClient } from "@/lib/supabase/client";
import type { MediaBucket } from "@/lib/media";

export const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
}

/**
 * Redueix una imatge al navegador abans de pujar-la (costat llarg màxim
 * `maxSide`). Prova WebP i, si el navegador no el sap generar (Safari /
 * iPhone retornen un PNG enorme sense avisar), fa servir JPEG.
 * Els GIF es pugen tal qual per no perdre l'animació.
 */
async function compress(file: File, maxSide: number): Promise<{ blob: Blob; ext: string }> {
  if (file.type === "image/gif") return { blob: file, ext: "gif" };

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  let blob = await toBlob(canvas, "image/webp", 0.82);

  if (!blob || blob.type !== "image/webp") {
    // JPEG no té transparència: fons blanc perquè els PNG amb transparència no surtin negres.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    blob = await toBlob(canvas, "image/jpeg", 0.82);
  }
  bitmap.close();
  if (!blob) throw new Error("No s'ha pogut processar la imatge.");

  // Si l'original ja era petit i lleuger (p. ex. un JPEG ja comprimit), ens el quedem.
  if (scale === 1 && file.size <= blob.size && (file.type === "image/jpeg" || file.type === "image/webp")) {
    return { blob: file, ext: EXT[file.type] };
  }
  return { blob, ext: EXT[blob.type] ?? "jpg" };
}

/**
 * Comprimeix i puja una imatge a la carpeta de l'usuari.
 * Retorna la ruta dins el bucket: <userId>/<uuid>.<ext>
 */
export async function uploadImage(
  file: File,
  { bucket, userId, maxSide = 1600, suffix }: {
    bucket: MediaBucket;
    userId: string;
    maxSide?: number;
    suffix?: string;
  },
) {
  if (!ACCEPTED_IMAGES.split(",").includes(file.type)) {
    throw new Error(`«${file.name}» no és una imatge compatible (JPG, PNG, WebP o GIF).`);
  }
  if (file.size > MAX_INPUT_BYTES) throw new Error(`«${file.name}» és massa gran.`);

  const { blob, ext } = await compress(file, maxSide);
  const path = `${userId}/${crypto.randomUUID()}${suffix ? `-${suffix}` : ""}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type || file.type, cacheControl: "31536000" });

  if (error) throw new Error("No s'ha pogut pujar la imatge. Torna-ho a provar.");
  return path;
}

/** Esborra fitxers pujats que al final no s'han fet servir (millor esforç). */
export async function discardUploads(bucket: MediaBucket, paths: string[]) {
  if (paths.length === 0) return;
  await createClient().storage.from(bucket).remove(paths);
}
