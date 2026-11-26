"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/form";
import { ACCEPTED_IMAGES, discardUploads, uploadImage } from "@/lib/images";
import { addGalleryPhotos } from "../actions";

const MAX = 20;

export function GalleryUploader({ userId }: { userId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const files = [...list].slice(0, MAX);
    setError(list.length > MAX ? `Només s'han agafat les ${MAX} primeres.` : null);

    startTransition(async () => {
      const uploaded: string[] = [];
      try {
        for (const [i, file] of files.entries()) {
          setStatus(`Pujant ${i + 1}/${files.length}…`);
          uploaded.push(await uploadImage(file, { bucket: "photos", userId }));
        }
        const res = await addGalleryPhotos(uploaded);
        if (!res.ok) throw new Error(res.error);
        router.refresh();
      } catch (err) {
        await discardUploads("photos", uploaded);
        setError(err instanceof Error ? err.message : "No s'han pogut pujar les fotos.");
      } finally {
        setStatus(null);
        if (input.current) input.current.value = "";
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        multiple
        className="sr-only"
        aria-label="Puja fotos"
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button size="sm" disabled={pending} onClick={() => input.current?.click()}>
        📷 Puja fotos
      </Button>
      {status ? <span className="text-xs text-tinta-suau">{status}</span> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
