import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { getNotifications, type NotificationView } from "@/features/notifications/queries";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import { requireMember } from "@/lib/auth";
import { formatPostDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Notificacions" };

const TEXT: Record<NotificationView["type"], string> = {
  wall_post: "ha escrit al teu mur.",
  comment: "ha comentat una publicació teva.",
  reply: "ha respost al teu comentari.",
  like: "li agrada la teva publicació.",
};

export default async function NotificationsPage() {
  await requireMember();
  const notifications = await getNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <PageShell>
      <Card>
        <CardHeader
          title="Notificacions"
          action={
            hasUnread ? (
              <form action={markAllNotificationsRead}>
                <Button type="submit" variant="enllac" size="sm">
                  Marca-les totes com a llegides
                </Button>
              </form>
            ) : null
          }
        />
        {notifications.length === 0 ? (
          <CardBody className="text-center text-tinta-suau">No tens cap notificació.</CardBody>
        ) : (
          <ul className="divide-y divide-linia-suau">
            {notifications.map((n) =>
              n.actor ? (
                <li
                  key={n.id}
                  className={`flex items-center gap-2.5 px-3 py-2 ${n.read_at ? "" : "bg-sorli-50"}`}
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
                    <span className="block text-xs text-tinta-suau">{formatPostDate(n.created_at)}</span>
                  </p>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
