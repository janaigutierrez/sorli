"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Notice, Textarea } from "@/components/ui/form";
import { ACCEPTED_IMAGES, discardUploads, uploadImage } from "@/lib/images";
import { createPost } from "../actions";

const MAX_PHOTOS = 10;

export function PostComposer({
  viewerId,
  wallOwnerId,
  placeholder = "Què hi ha de nou?",
}: {
  viewerId: string;
  wallOwnerId: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = [...list].slice(0, MAX_PHOTOS - files.length);
    if (list.length > incoming.length) setError(`Màxim ${MAX_PHOTOS} fotos per publicació.`);
    setFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeFile(i: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, j) => j !== i);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim() && files.length === 0) return;

    startTransition(async () => {
      const uploaded: string[] = [];
      try {
        for (const [i, { file }] of files.entries()) {
          setStatus(files.length > 1 ? `Pujant fotos (${i + 1}/${files.length})…` : "Pujant la foto…");
          uploaded.push(await uploadImage(file, { bucket: "photos", userId: viewerId }));
        }
        setStatus("Publicant…");
        const res = await createPost({ wallOwnerId, body, photoPaths: uploaded });
        if (!res.ok) throw new Error(res.error);

        files.forEach((f) => URL.revokeObjectURL(f.preview));
        setBody("");
        setFiles([]);
        router.refresh();
      } catch (err) {
        await discardUploads("photos", uploaded);
        setError(err instanceof Error ? err.message : "No s'ha pogut publicar.");
      } finally {
        setStatus(null);
      }
    });
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-2">
          {error ? <Notice tone="error">{error}</Notice> : null}
          <label htmlFor={`composer-${wallOwnerId}`} className="sr-only">
            Publicació
          </label>
          <Textarea
            id={`composer-${wallOwnerId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            maxLength={5000}
            disabled={pending}
          />

          {files.length > 0 ? (
            <ul className="grid grid-cols-5 gap-1">
              {files.map((f, i) => (
                <li key={f.preview} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- previsualització local (blob:) */}
                  <img src={f.preview} alt="" className="aspect-square w-full border border-linia object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={pending}
                    className="absolute top-0.5 right-0.5 bg-white/90 px-1 text-xs font-bold text-tinta"
                    aria-label={`Treu ${f.file.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_IMAGES}
              multiple
              className="sr-only"
              id={`photos-${wallOwnerId}`}
              onChange={(e) => addFiles(e.target.files)}
              disabled={pending || files.length >= MAX_PHOTOS}
            />
            <Button
              variant="secundari"
              size="sm"
              onClick={() => fileInput.current?.click()}
              disabled={pending || files.length >= MAX_PHOTOS}
            >
              📷 Afegeix fotos
            </Button>
            <div className="flex items-center gap-2">
              {status ? <span className="text-xs text-tinta-suau">{status}</span> : null}
              <Button type="submit" disabled={pending || (!body.trim() && files.length === 0)}>
                Publica
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
