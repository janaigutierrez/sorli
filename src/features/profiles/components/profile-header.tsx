import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatBirthday } from "@/lib/dates";
import { mediaUrl } from "@/lib/media";
import type { Profile } from "@/types/database";
import { ProfileTabs } from "./profile-tabs";

/** Capçalera de perfil: portada, avatar quadrat gran, nom, dades i pestanyes. */
export function ProfileHeader({ profile, isMe }: { profile: Profile; isMe: boolean }) {
  const cover = mediaUrl("avatars", profile.cover_path);

  return (
    <section className="border border-linia bg-paper">
      <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-sorli-300 via-sorli-500 to-mar-600 sm:h-[220px]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media
          <img src={cover} alt="" className="size-full object-cover" />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-3 pb-2 sm:flex-row sm:items-end">
        <Avatar
          name={profile.display_name}
          src={mediaUrl("avatars", profile.avatar_path)}
          size="lg"
          className="relative z-10 -mt-[60px] border-4 border-white bg-sorli-100 sm:-mt-[90px]"
        />
        <div className="min-w-0 flex-1 sm:pb-1">
          <h1 className="text-[22px] leading-tight font-bold text-tinta">{profile.display_name}</h1>
          <p className="text-sm text-tinta-suau">
            @{profile.username}
            {profile.city ? ` · ${profile.city}` : null}
            {profile.birthday ? ` · 🎂 ${formatBirthday(profile.birthday)}` : null}
          </p>
          {profile.bio ? <p className="mt-1 whitespace-pre-line">{profile.bio}</p> : null}
        </div>
        {isMe ? (
          <Link
            href={`/perfil/${profile.username}/editar`}
            className="self-start border border-linia bg-[#f4f6f6] px-3 py-1 text-sm font-bold text-tinta no-underline hover:bg-linia-suau hover:no-underline sm:self-end"
          >
            Edita el perfil
          </Link>
        ) : null}
      </div>

      <ProfileTabs username={profile.username} />
    </section>
  );
}
