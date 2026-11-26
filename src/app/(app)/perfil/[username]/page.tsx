import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PostComposer } from "@/features/posts/components/post-composer";
import { PostList } from "@/features/posts/components/post-list";
import { getPosts } from "@/features/posts/queries";
import { getProfileByUsername } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";
import { formatBirthday } from "@/lib/dates";

/** Pestanya "Mur". */
export default async function WallPage({ params, searchParams }: PageProps<"/perfil/[username]">) {
  const me = await requireMember();
  const { username } = await params;
  const { abans } = await searchParams;
  const before = typeof abans === "string" ? abans : undefined;

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();
  const isMe = profile.id === me.id;
  const firstName = profile.display_name.split(" ")[0];

  const { posts, nextCursor } = await getPosts({ wallOwnerId: profile.id, before });

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <aside className="md:w-[240px] md:shrink-0">
        <Card>
          <CardHeader title="Informació" />
          <CardBody className="space-y-1 text-sm">
            <InfoRow label="Usuari" value={`@${profile.username}`} />
            {profile.city ? <InfoRow label="Ciutat" value={profile.city} /> : null}
            {profile.birthday ? <InfoRow label="Aniversari" value={formatBirthday(profile.birthday)} /> : null}
            <InfoRow
              label="A Sorli des de"
              value={new Intl.DateTimeFormat("ca", { month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(
                new Date(profile.created_at),
              )}
            />
          </CardBody>
        </Card>
      </aside>

      <div className="min-w-0 flex-1 space-y-3">
        {!before ? (
          <PostComposer
            viewerId={me.id}
            wallOwnerId={profile.id}
            placeholder={isMe ? "Què hi ha de nou?" : `Escriu alguna cosa a ${firstName}…`}
          />
        ) : null}
        <PostList
          posts={posts}
          viewer={{ id: me.id, role: me.role }}
          nextHref={
            nextCursor
              ? `/perfil/${profile.username}?abans=${encodeURIComponent(nextCursor)}`
              : undefined
          }
          emptyText={isMe ? "El teu mur és buit. Escriu-hi alguna cosa!" : `El mur de ${firstName} és buit.`}
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2">
      <span className="w-24 shrink-0 text-tinta-suau">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </p>
  );
}
