"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";
import { mediaUrl } from "@/lib/media";

/** Fotos d'una publicació: 1 en gran, 2+ en graella. En clicar, s'obren al visor. */
export function PostPhotos({ photos }: { photos: { id: string; storage_path: string }[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const srcs = photos.map((p) => mediaUrl("photos", p.storage_path)!);

  return (
    <>
      {photos.length === 1 ? (
        <button
          type="button"
          onClick={() => setIndex(0)}
          className="mt-2 block w-full cursor-zoom-in border border-linia bg-fons"
          aria-label="Amplia la foto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media */}
          <img src={srcs[0]} alt="" loading="lazy" className="mx-auto max-h-[480px] w-auto max-w-full" />
        </button>
      ) : (
        <ul className={`mt-2 grid gap-1 ${photos.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="block w-full cursor-zoom-in border border-linia"
                aria-label={`Amplia la foto ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media */}
                <img src={srcs[i]} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Lightbox photos={srcs} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} />
    </>
  );
}
