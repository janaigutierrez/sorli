import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { formatFullDate, formatPostDate } from "@/lib/dates";
import { mediaUrl } from "@/lib/media";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import type { PostView } from "../queries";
import { PostFooter } from "./post-footer";
import { DeletePostButton } from "./delete-post-button";

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

function PostPhotos({ photos }: { photos: PostView["photos"] }) {
  if (photos.length === 1) {
    const src = mediaUrl("photos", photos[0].storage_path)!;
    return (
      <a href={src} target="_blank" rel="noopener" className="mt-2 block border border-linia bg-fons">
        {/* eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media */}
        <img src={src} alt="" loading="lazy" className="mx-auto max-h-[480px] w-auto max-w-full" />
      </a>
    );
  }
  return (
    <ul className={`mt-2 grid gap-1 ${photos.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {photos.map((p) => {
        const src = mediaUrl("photos", p.storage_path)!;
        return (
          <li key={p.id}>
            <a href={src} target="_blank" rel="noopener" className="block border border-linia">
              {/* eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media */}
              <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
