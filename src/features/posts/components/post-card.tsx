import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { formatFullDate, formatPostDate } from "@/lib/dates";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import type { PostView } from "../queries";
import { PostFooter } from "./post-footer";
import { DeletePostButton } from "./delete-post-button";
import { PostPhotos } from "./post-photos";

export type Viewer = { id: string; role: "admin" | "member" };

export function PostCard({ post, viewer }: { post: PostView; viewer: Viewer }) {
  const onOtherWall = post.author_id !== post.wall_owner_id;
  const canDelete =
    viewer.id === post.author_id || viewer.id === post.wall_owner_id || viewer.role === "admin";

  return (
    <Card>
      <CardBody className="flex gap-2.5">
        <MemberAvatar member={post.author} />
        <article className="min-w-0 flex-1">
          <header className="flex items-start justify-between gap-2">
            <p>
              <MemberLink member={post.author} />
              {onOtherWall ? (
                <>
                  <span className="text-tinta-suau" aria-label="al mur de">
                    {" "}▸{" "}
                  </span>
                  <MemberLink member={post.wall_owner} />
                </>
              ) : null}
            </p>
            {canDelete ? <DeletePostButton postId={post.id} /> : null}
          </header>

          {post.body ? (
            <p className="mt-0.5 break-words whitespace-pre-line">{post.body}</p>
          ) : null}

          {post.photos.length > 0 ? <PostPhotos photos={post.photos} /> : null}

          <PostFooter
            postId={post.id}
            wallOwnerId={post.wall_owner_id}
            viewer={viewer}
            likes={post.likes}
            comments={post.comments.map((c) => ({ ...c, dateLabel: formatPostDate(c.created_at) }))}
            dateSlot={
              <Link
                href={`/publicacio/${post.id}`}
                title={formatFullDate(post.created_at)}
                className="text-tinta-suau"
              >
                {formatPostDate(post.created_at)}
              </Link>
            }
          />
        </article>
      </CardBody>
    </Card>
  );
}
