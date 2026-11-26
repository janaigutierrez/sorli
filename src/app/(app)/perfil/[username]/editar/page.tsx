import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ImagePicker } from "@/features/profiles/components/image-picker";
import { ProfileForm } from "@/features/profiles/components/profile-form";
import { requireMember } from "@/lib/auth";

export const metadata = { title: "Edita el perfil" };

/** Només es pot editar el propi perfil (la RLS també ho impedeix). */
export default async function EditProfilePage({ params }: PageProps<"/perfil/[username]/editar">) {
  const me = await requireMember();
  const { username } = await params;
  if (username !== me.username) redirect(`/perfil/${username}`);

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_280px]">
      <Card>
        <CardHeader
          title="Dades personals"
          action={<Link href={`/perfil/${me.username}`}>← Torna al perfil</Link>}
        />
        <CardBody>
          <ProfileForm profile={me} />
        </CardBody>
      </Card>

      <Card className="self-start">
        <CardHeader title="Fotografies" />
        <CardBody className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-bold text-tinta-suau">Foto de perfil</p>
            <ImagePicker kind="avatar" userId={me.id} hasImage={Boolean(me.avatar_path)} label="Canvia la foto" />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-tinta-suau">Portada</p>
            <ImagePicker kind="cover" userId={me.id} hasImage={Boolean(me.cover_path)} label="Canvia la portada" />
          </div>
          <p className="text-xs text-tinta-suau">
            Les dades del compte (correu, contrasenya…) són a <Link href="/ajustos">Ajustos</Link>.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
