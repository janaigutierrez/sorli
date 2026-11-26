import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DeletePhotoButton } from "@/features/photos/components/delete-photo-button";
import { GalleryUploader } from "@/features/photos/components/gallery-uploader";
import { getGallery } from "@/features/photos/queries";
import { getProfileByUsername } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";
import { formatFullDate } from "@/lib/dates";
import { mediaUrl } from "@/lib/media";

/** Pestanya "Fotos": àlbum global de les fotos pròpies del membre. */
export default async function PhotosPage({ params }: PageProps<"/perfil/[username]/fotos">) {
  const me = await requireMember();
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const isMe = profile.id === me.id;
  const canDelete = isMe || me.role === "admin";
  const photos = await getGallery(profile.id);

  return (
    <Card>
      <CardHeader
        title={`Fotos de ${profile.display_name} (${photos.length})`}
        action={isMe ? <GalleryUploader userId={me.id} /> : null}
      />
      <CardBody>
        {photos.length === 0 ? (
          <p className="py-6 text-center text-tinta-suau">
            {isMe ? "Encara no has pujat cap foto." : "Encara no hi ha fotos."}
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
            {photos.map((p) => {
              const src = mediaUrl("photos", p.storage_path)!;
              return (
                <li key={p.id} className="group relative">
                  <a href={src} target="_blank" rel="noopener" title={formatFullDate(p.created_at)} className="block border border-linia bg-fons">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media */}
                    <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </a>
                  {p.post_id ? (
                    <Link href={`/publicacio/${p.post_id}`} className="mt-0.5 block text-center text-[10px]">
                      Veure la publicació
                    </Link>
                  ) : null}
                  {canDelete ? <DeletePhotoButton photoId={p.id} inPost={Boolean(p.post_id)} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
