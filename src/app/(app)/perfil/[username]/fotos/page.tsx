import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { GalleryGrid } from "@/features/photos/components/gallery-grid";
import { GalleryUploader } from "@/features/photos/components/gallery-uploader";
import { getGallery } from "@/features/photos/queries";
import { getProfileByUsername } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";

/** Pestanya "Fotos": àlbum global de les fotos pròpies del membre. */
export default async function PhotosPage({ params }: PageProps<"/perfil/[username]/fotos">) {
  const me = await requireMember();
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const isMe = profile.id === me.id;
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
          <GalleryGrid photos={photos} canDelete={isMe || me.role === "admin"} />
        )}
      </CardBody>
    </Card>
  );
}
