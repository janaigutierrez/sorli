"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbox } from "@/components/ui/lightbox";
import { mediaUrl } from "@/lib/media";
import type { GalleryPhoto } from "../queries";
import { DeletePhotoButton } from "./delete-photo-button";

export function GalleryGrid({ photos, canDelete }: { photos: GalleryPhoto[]; canDelete: boolean }) {
  const [index, setIndex] = useState<number | null>(null);
  const srcs = photos.map((p) => mediaUrl("photos", p.storage_path)!);

  return (
    <>
      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
        {photos.map((p, i) => (
          <li key={p.id} className="group relative">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="block w-full cursor-zoom-in border border-linia bg-fons"
              aria-label={`Amplia la foto ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media */}
              <img src={srcs[i]} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            </button>
            {p.post_id ? (
              <Link href={`/publicacio/${p.post_id}`} className="mt-0.5 block text-center text-[10px]">
                Veure la publicació
              </Link>
            ) : null}
            {canDelete ? <DeletePhotoButton photoId={p.id} inPost={Boolean(p.post_id)} /> : null}
          </li>
        ))}
      </ul>
      <Lightbox photos={srcs} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}
