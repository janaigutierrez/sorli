import { notFound } from "next/navigation";
import { Music } from "@/features/personal/components/music";
import { getMusic } from "@/features/personal/queries";
import { getProfileByUsername } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";

/** Pestanya "Música": música actual + playlists de Spotify. */
export default async function MusicPage({ params }: PageProps<"/perfil/[username]/musica">) {
  const me = await requireMember();
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const { songs, playlists } = await getMusic(profile.id);

  return (
    <Music
      songs={songs}
      playlists={playlists}
      isMe={profile.id === me.id}
      canModerate={me.role === "admin"}
      userId={me.id}
      firstName={profile.display_name.split(" ")[0]}
    />
  );
}
