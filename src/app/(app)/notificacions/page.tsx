import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MarkReadOnView } from "@/features/notifications/components/mark-read-on-view";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { getNotifications } from "@/features/notifications/queries";
import { requireMember } from "@/lib/auth";
import { formatPostDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Notificacions" };

export default async function NotificationsPage() {
  await requireMember();
  const notifications = await getNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <PageShell>
      <Card>
        <CardHeader title="Notificacions" />
        {notifications.length === 0 ? (
          <CardBody className="text-center text-tinta-suau">No tens cap notificació.</CardBody>
        ) : (
          <NotificationList
            notifications={notifications.map((n) => ({ ...n, dateLabel: formatPostDate(n.created_at) }))}
          />
        )}
      </Card>
      <MarkReadOnView hasUnread={hasUnread} />
    </PageShell>
  );
}
