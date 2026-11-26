import type { Metadata } from "next";
import Link from "next/link";
import { MembersBox } from "@/components/layout/members-box";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardBody } from "@/components/ui/card";
import { PostComposer } from "@/features/posts/components/post-composer";
import { PostList } from "@/features/posts/components/post-list";
import { getPosts } from "@/features/posts/queries";
import { MemberAvatar } from "@/features/profiles/components/member-link";
import { listMembers } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Inici" };

export default async function HomePage({ searchParams }: PageProps<"/inici">) {
  const me = await requireMember();
  const { abans } = await searchParams;
  const before = typeof abans === "string" ? abans : undefined;

  const [{ posts, nextCursor }, members] = await Promise.all([
    getPosts({ before }),
    listMembers(),
  ]);

  return (
    <PageShell
      left={
        <nav aria-label="Dreceres" className="space-y-0.5 text-sm">
          <div className="mb-2 flex items-center gap-2 px-1">
            <MemberAvatar member={me} size="xs" />
            <Link href={`/perfil/${me.username}`} className="font-bold">
              {me.display_name}
            </Link>
          </div>
          <SideLink href="/inici" active>Novetats</SideLink>
          <SideLink href={`/perfil/${me.username}`}>El meu mur</SideLink>
          <SideLink href={`/perfil/${me.username}/fotos`}>Fotos</SideLink>
          <SideLink href={`/perfil/${me.username}/wishes`}>Wishes</SideLink>
          <SideLink href={`/perfil/${me.username}/musica`}>Música</SideLink>
          <SideLink href="/notificacions">Notificacions</SideLink>
          {me.role === "admin" ? <SideLink href="/admin">⚙️ Administració</SideLink> : null}
        </nav>
      }
      right={<MembersBox members={members} />}
    >
      <div className="space-y-3">
        {!before ? (
          <>
            <Card>
              <CardBody className="py-2">
                <h1 className="text-xl font-bold text-sorli-800">Benvinguts a Sorli</h1>
              </CardBody>
            </Card>
            <PostComposer viewerId={me.id} wallOwnerId={me.id} />
          </>
        ) : null}

        <PostList
          posts={posts}
          viewer={{ id: me.id, role: me.role }}
          nextHref={nextCursor ? `/inici?abans=${encodeURIComponent(nextCursor)}` : undefined}
          emptyText="Encara no hi ha res. Sigues el primer a publicar!"
        />
      </div>
    </PageShell>
  );
}

function SideLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block px-2 py-1 font-bold no-underline hover:bg-sorli-50 hover:no-underline ${
        active ? "bg-sorli-100 text-sorli-800" : "text-tinta"
      }`}
    >
      {children}
    </Link>
  );
}
