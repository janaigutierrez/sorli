import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/layout/page-shell";
import { PostCard } from "@/features/posts/components/post-card";
import { getPost } from "@/features/posts/queries";
import { requireMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Publicació" };

/** Enllaç permanent a una publicació (des de les notificacions o la data). */
export default async function PostPage({ params }: PageProps<"/publicacio/[id]">) {
  const me = await requireMember();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const post = await getPost(id);
  if (!post) notFound();

  return (
    <PageShell>
      <PostCard post={post} viewer={{ id: me.id, role: me.role }} />
    </PageShell>
  );
}
