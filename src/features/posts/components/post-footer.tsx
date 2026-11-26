"use client";

import { useOptimistic, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import type { CommentView } from "../queries";
import { addComment, deleteComment, setLike } from "../actions";
import type { Viewer } from "./post-card";

type Like = { user_id: string; username: string; display_name: string };
type Comment = CommentView & { dateLabel: string };

export function PostFooter({
  postId,
  wallOwnerId,
  viewer,
  likes,
  comments,
  dateSlot,
}: {
  postId: string;
  wallOwnerId: string;
  viewer: Viewer;
  likes: Like[];
  comments: Comment[];
  dateSlot: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(
    likes.some((l) => l.user_id === viewer.id),
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const commentBox = useRef<HTMLTextAreaElement>(null);

  function toggleLike() {
    const next = !optimisticLiked;
    startTransition(async () => {
      setOptimisticLiked(next);
      const res = await setLike(postId, next);
      if (!res.ok) window.alert(res.error);
      router.refresh();
    });
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);
  const othersWhoLike = likes.filter((l) => l.user_id !== viewer.id);
  const showBox = likes.length > 0 || optimisticLiked || comments.length > 0 || composerOpen;

  return (
    <div className="mt-1.5">
      <p className="text-xs text-tinta-suau">
        {dateSlot}
        {" · "}
        <button type="button" onClick={toggleLike} className="text-sorli-700 hover:underline">
          {optimisticLiked ? "Ja no m'agrada" : "M'agrada"}
        </button>
        {" · "}
        <button
          type="button"
          className="text-sorli-700 hover:underline"
          onClick={() => {
            setComposerOpen(true);
            requestAnimationFrame(() => commentBox.current?.focus());
          }}
        >
          Comenta
        </button>
      </p>

      {showBox ? (
        <div className="mt-2 space-y-px">
          {optimisticLiked || othersWhoLike.length > 0 ? (
            <p className="bg-sorli-50 px-2 py-1 text-xs">
              👍 <LikesText liked={optimisticLiked} others={othersWhoLike} />
            </p>
          ) : null}

          {topLevel.map((c) => (
            <div key={c.id}>
              <CommentItem comment={c} postId={postId} wallOwnerId={wallOwnerId} viewer={viewer} />
              {repliesOf(c.id).length > 0 ? (
                <div className="ml-10 space-y-px">
                  {repliesOf(c.id).map((r) => (
                    <CommentItem
                      key={r.id}
                      comment={r}
                      postId={postId}
                      wallOwnerId={wallOwnerId}
                      viewer={viewer}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          <div className="bg-sorli-50 px-2 py-1.5">
            <CommentForm postId={postId} parentId={null} textareaRef={commentBox} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LikesText({ liked, others }: { liked: boolean; others: Like[] }) {
  const shown = others.slice(0, 2);
  const rest = others.length - shown.length;
  const names: ReactNode[] = [
    ...(liked ? ["A tu"] : []),
    ...shown.map((l) => (
      <MemberLink
        key={l.user_id}
        member={{ id: l.user_id, username: l.username, display_name: l.display_name, avatar_path: null }}
      />
    )),
  ];
  if (rest > 0) names.push(`${rest} ${rest === 1 ? "persona" : "persones"} més`);

  const count = names.length;
  const total = (liked ? 1 : 0) + others.length;
  return (
    <>
      {liked ? null : "A "}
      {names.map((n, i) => (
        <span key={i}>
          {i > 0 ? (i === count - 1 ? " i " : ", ") : null}
          {n}
        </span>
      ))}
      {liked && total === 1 ? " t'agrada això." : total === 1 ? " li agrada això." : " els agrada això."}
    </>
  );
}

function CommentItem({
  comment,
  postId,
  wallOwnerId,
  viewer,
}: {
  comment: Comment;
  postId: string;
  wallOwnerId: string;
  viewer: Viewer;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [pending, startTransition] = useTransition();
  const canDelete =
    viewer.id === comment.author_id || viewer.id === wallOwnerId || viewer.role === "admin";

  return (
    <>
      <div className={`flex gap-2 bg-sorli-50 px-2 py-1.5 ${pending ? "opacity-50" : ""}`}>
        <MemberAvatar member={comment.author} size="xs" />
        <div className="min-w-0 text-sm">
          <MemberLink member={comment.author} />{" "}
          <span className="break-words whitespace-pre-line">{comment.body}</span>
          <span className="block text-xs text-tinta-suau">
            {comment.dateLabel}
            {!comment.parent_id ? (
              <>
                {" · "}
                <button type="button" className="text-sorli-700 hover:underline" onClick={() => setReplying((r) => !r)}>
                  Respon
                </button>
              </>
            ) : null}
            {canDelete ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="text-sorli-700 hover:underline"
                  onClick={() => {
                    if (!window.confirm("Vols eliminar aquest comentari?")) return;
                    startTransition(async () => {
                      const res = await deleteComment(comment.id);
                      if (!res.ok) window.alert(res.error);
                      router.refresh();
                    });
                  }}
                >
                  Elimina
                </button>
              </>
            ) : null}
          </span>
        </div>
      </div>
      {replying ? (
        <div className="ml-10 bg-sorli-50 px-2 py-1.5">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            autoFocus
            placeholder={`Respon a ${comment.author.display_name}…`}
            onDone={() => setReplying(false)}
          />
        </div>
      ) : null}
    </>
  );
}

function CommentForm({
  postId,
  parentId,
  placeholder = "Escriu un comentari…",
  autoFocus,
  onDone,
  textareaRef,
}: {
  postId: string;
  parentId: string | null;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addComment({ postId, parentId, body });
      if (!res.ok) return setError(res.error);
      setBody("");
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form
      className="flex items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          aria-label={placeholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia, Maj+Enter fa salt de línia (com abans)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={2000}
          disabled={pending}
          className="min-h-[26px] py-0.5 text-sm"
          rows={1}
        />
        {error ? <p className="text-xs text-perill">{error}</p> : null}
      </div>
      <Button type="submit" size="sm" disabled={pending || !body.trim()}>
        Envia
      </Button>
    </form>
  );
}
