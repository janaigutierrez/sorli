import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import type { PostView } from "../queries";
import { PostCard, type Viewer } from "./post-card";

export function PostList({
  posts,
  viewer,
  nextHref,
  emptyText = "Encara no hi ha publicacions.",
}: {
  posts: PostView[];
  viewer: Viewer;
  nextHref?: string;
  emptyText?: string;
}) {
  if (posts.length === 0) {
    return (
      <Card>
        <CardBody className="text-center text-tinta-suau">{emptyText}</CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewer={viewer} />
      ))}
      {nextHref ? (
        <Link
          href={nextHref}
          className="block border border-linia bg-paper py-2 text-center text-sm font-bold no-underline hover:bg-sorli-50"
        >
          Publicacions anteriors
        </Link>
      ) : null}
    </div>
  );
}
