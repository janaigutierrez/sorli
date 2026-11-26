"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePhoto } from "../actions";

export function DeletePhotoButton({ photoId, inPost }: { photoId: string; inPost: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Elimina la foto"
      title="Elimina la foto"
      className="absolute top-1 right-1 border border-linia bg-white/90 px-1 text-xs font-bold text-tinta sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
      onClick={() => {
        const msg = inPost
          ? "Aquesta foto és en una publicació i també en desapareixerà. L'elimines?"
          : "Vols eliminar aquesta foto?";
        if (!window.confirm(msg)) return;
        startTransition(async () => {
          const res = await deletePhoto(photoId);
          if (!res.ok) window.alert(res.error);
          router.refresh();
        });
      }}
    >
      ✕
    </button>
  );
}
