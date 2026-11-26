"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead } from "../actions";

/**
 * En obrir la pàgina de notificacions, les marca totes com a llegides
 * (com el Facebook clàssic) i refresca la capçalera perquè el 🔔 es posi a zero.
 * Es fa des del client, un cop la pàgina ja s'ha pintat amb les noves ressaltades.
 */
export function MarkReadOnView({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    markAllNotificationsRead().then(() => router.refresh());
  }, [hasUnread, router]);

  return null;
}
