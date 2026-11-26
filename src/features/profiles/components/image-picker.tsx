"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/form";
import { ACCEPTED_IMAGES, discardUploads, uploadImage } from "@/lib/images";
import { setProfileImage } from "../actions";

/** Canvia la foto de perfil o la portada. */
export function ImagePicker({
  kind,
  userId,
  hasImage,
  label,
}: {
  kind: "avatar" | "cover";
  userId: string;
  hasImage: boolean;
  label: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      let path: string | null = null;
      try {
        path = await uploadImage(file, {
          bucket: "avatars",
          userId,
          maxSide: kind === "avatar" ? 480 : 1600,
          suffix: kind,
        });
        const res = await setProfileImage(kind, path);
        if (!res.ok) throw new Error(res.error);
        router.refresh();
      } catch (err) {
        if (path) await discardUploads("avatars", [path]);
        setError(err instanceof Error ? err.message : "No s'ha pogut canviar la imatge.");
      } finally {
        if (input.current) input.current.value = "";
      }
    });
  }

  function remove() {
    if (!window.confirm("Vols treure aquesta imatge?")) return;
    startTransition(async () => {
      const res = await setProfileImage(kind, null);
      if (!res.ok) setError(res.error ?? "Error");
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="sr-only"
        aria-label={label}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="flex gap-2">
        <Button variant="secundari" size="sm" disabled={pending} onClick={() => input.current?.click()}>
          {pending ? "Pujant…" : label}
        </Button>
        {hasImage ? (
          <Button variant="enllac" size="sm" disabled={pending} onClick={remove}>
            Treu-la
          </Button>
        ) : null}
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
