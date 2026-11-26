"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "../actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title="Elimina la publicació"
      aria-label="Elimina la publicació"
      disabled={pending}
      className="px-1 text-xs text-tinta-suau hover:text-perill disabled:opacity-50"
      onClick={() => {
        if (!window.confirm("Segur que vols eliminar aquesta publicació?")) return;
        startTransition(async () => {
          const res = await deletePost(postId);
          if (!res.ok) window.alert(res.error);
          router.refresh();
        });
      }}
    >
      ✕
    </button>
  );
}
