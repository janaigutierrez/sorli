import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DeleteCommentButton } from "@/features/admin/components/admin-buttons";
import { recentComments } from "@/features/admin/queries";
import { PostList } from "@/features/posts/components/post-list";
import { getPosts } from "@/features/posts/queries";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import { requireAdmin } from "@/lib/auth";
import { formatPostDate } from "@/lib/dates";

export const metadata = { title: "Moderació" };

/**
 * Contingut recent de tota la comunitat. Com a admin pots eliminar
 * qualsevol publicació (✕), comentari, foto, desig o cançó també des dels
 * perfils: aquí només ho tens tot junt.
 */
export default async function ModerationPage() {
  const me = await requireAdmin();
  const [{ posts }, comments] = await Promise.all([getPosts(), recentComments()]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <div className="min-w-0 flex-1 space-y-3">
        <h2 className="text-lg font-bold">Publicacions recents</h2>
        <PostList posts={posts} viewer={{ id: me.id, role: me.role }} />
      </div>

      <aside className="md:w-[320px] md:shrink-0">
        <Card>
          <CardHeader title="Comentaris recents" />
          {comments.length === 0 ? (
            <CardBody className="text-center text-tinta-suau">Cap comentari.</CardBody>
          ) : (
            <ul className="divide-y divide-linia-suau">
              {comments.map((c) =>
                c.author ? (
                  <li key={c.id} className="flex gap-2 px-3 py-2 text-sm">
                    <MemberAvatar member={c.author} size="xs" />
                    <div className="min-w-0 flex-1">
                      <MemberLink member={c.author} />{" "}
                      <span className="break-words">{c.body.length > 140 ? `${c.body.slice(0, 140)}…` : c.body}</span>
                      <p className="flex items-center gap-1 text-xs text-tinta-suau">
                        {formatPostDate(c.created_at)} · <Link href={`/publicacio/${c.post_id}`}>context</Link> ·
                        <DeleteCommentButton id={c.id} />
                      </p>
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  );
}
