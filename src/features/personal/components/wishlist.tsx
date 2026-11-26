"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Label, Notice, Textarea } from "@/components/ui/form";
import { discardUploads, uploadImage } from "@/lib/images";
import { mediaUrl } from "@/lib/media";
import type { WishItem } from "../queries";
import { deleteWish, saveWish } from "../actions";
import { ImageInput } from "./image-input";

export function Wishlist({
  items,
  isMe,
  canModerate,
  userId,
  firstName,
}: {
  items: WishItem[];
  isMe: boolean;
  canModerate: boolean;
  userId: string;
  firstName: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {isMe ? (
        adding ? (
          <Card>
            <CardBody>
              <WishForm userId={userId} onDone={() => setAdding(false)} />
            </CardBody>
          </Card>
        ) : (
          <Button onClick={() => setAdding(true)}>🎁 Afegeix un desig</Button>
        )
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardBody className="py-6 text-center text-tinta-suau">
            {isMe
              ? "La teva llista és buida. Afegeix-hi coses que et facin il·lusió!"
              : `${firstName} encara no ha afegit cap desig.`}
          </CardBody>
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WishCard key={item.id} item={item} isMe={isMe} canDelete={isMe || canModerate} userId={userId} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WishCard({
  item,
  isMe,
  canDelete,
  userId,
}: {
  item: WishItem;
  isMe: boolean;
  canDelete: boolean;
  userId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const img = mediaUrl("photos", item.image_path);

  if (editing) {
    return (
      <li className="col-span-2 sm:col-span-3 lg:col-span-4">
        <Card>
          <CardBody>
            <WishForm userId={userId} item={item} onDone={() => setEditing(false)} />
          </CardBody>
        </Card>
      </li>
    );
  }

  return (
    <li className={`flex flex-col border border-linia bg-paper ${pending ? "opacity-50" : ""}`}>
      <div className="flex aspect-square items-center justify-center border-b border-linia-suau bg-fons text-4xl">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media
          <img src={img} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          "🎁"
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <h3 className="font-bold break-words">{item.name}</h3>
        {item.description ? (
          <p className="text-sm break-words whitespace-pre-line text-tinta-suau">{item.description}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-2 pt-1 text-xs">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer nofollow">
              Veure a la botiga ↗
            </a>
          ) : null}
          {isMe ? (
            <button type="button" className="text-sorli-700 hover:underline" onClick={() => setEditing(true)}>
              Edita
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="text-sorli-700 hover:underline"
              onClick={() => {
                if (!window.confirm(`Vols treure «${item.name}» de la llista?`)) return;
                startTransition(async () => {
                  const res = await deleteWish(item.id);
                  if (!res.ok) window.alert(res.error);
                  router.refresh();
                });
              }}
            >
              Elimina
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function WishForm({ userId, item, onDone }: { userId: string; item?: WishItem; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(item?.name ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [keepImage, setKeepImage] = useState(Boolean(item?.image_path));
  const [preview, setPreview] = useState<string | null>(mediaUrl("photos", item?.image_path));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let uploaded: string | null = null;
      try {
        if (file) uploaded = await uploadImage(file, { bucket: "photos", userId, maxSide: 800, suffix: "wish" });
        const imagePath = uploaded ?? (keepImage ? (item?.image_path ?? null) : null);
        const res = await saveWish({ id: item?.id, name, url, description, imagePath });
        if (!res.ok) throw new Error(res.error);
        router.refresh();
        onDone();
      } catch (err) {
        if (uploaded) await discardUploads("photos", [uploaded]);
        setError(err instanceof Error ? err.message : "No s'ha pogut desar.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2.5" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Què t'agradaria?" name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus />
        <Field label="Enllaç a la botiga (opcional)" name="url" type="url" inputMode="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="wish-desc">Descripció (opcional)</Label>
        <Textarea id="wish-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="Talla, color, per què m'agrada…" />
      </div>
      <ImageInput
        label="Foto"
        preview={preview}
        disabled={pending}
        onPick={(f) => {
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }}
        onClear={() => {
          setFile(null);
          setKeepImage(false);
          setPreview(null);
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "Desant…" : item ? "Desa" : "Afegeix"}
        </Button>
        <Button variant="secundari" disabled={pending} onClick={onDone}>
          Cancel·la
        </Button>
      </div>
    </form>
  );
}
