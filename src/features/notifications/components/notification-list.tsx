"use client";

import { useState } from "react";
import Link from "next/link";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import type { NotificationView } from "../queries";

const TEXT: Record<NotificationView["type"], string> = {
  wall_post: "ha escrit al teu mur.",
  comment: "ha comentat una publicació teva.",
  reply: "ha respost al teu comentari.",
  like: "li agrada la teva publicació.",
};

/**
 * Llista de notificacions. Recorda quines eren noves en entrar, perquè
 * continuïn ressaltades encara que el servidor ja les hagi marcat com a llegides.
 */
export function NotificationList({
  notifications,
}: {
  notifications: (NotificationView & { dateLabel: string })[];
}) {
  const [newIds] = useState(() => new Set(notifications.filter((n) => !n.read_at).map((n) => n.id)));

  return (
    <ul className="divide-y divide-linia-suau">
      {notifications.map((n) =>
        n.actor ? (
          <li
            key={n.id}
            className={`flex items-center gap-2.5 px-3 py-2 ${newIds.has(n.id) ? "bg-sorli-50" : ""}`}
          >
            <MemberAvatar member={n.actor} size="xs" />
            <p className="min-w-0 flex-1 text-sm">
              <MemberLink member={n.actor} /> {TEXT[n.type]}
              {n.post_id ? (
                <>
                  {" "}
                  <Link href={`/publicacio/${n.post_id}`}>Veure-la</Link>
                </>
              ) : null}
              <span className="block text-xs text-tinta-suau">
                {n.dateLabel}
                {newIds.has(n.id) ? <b className="ml-1.5 text-sorli-700">· nova</b> : null}
              </span>
            </p>
          </li>
        ) : null,
      )}
    </ul>
  );
}
