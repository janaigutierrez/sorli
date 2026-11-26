import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { getUnreadCount } from "@/features/notifications/queries";
import { requireMember } from "@/lib/auth";

/** Zona de membres: tota pàgina aquí dins requereix un membre actiu. */
export default async function MembersLayout({ children }: { children: ReactNode }) {
  const profile = await requireMember();
  const unreadCount = await getUnreadCount();

  return (
    <>
      <Header profileHref={`/perfil/${profile.username}`} unreadCount={unreadCount} />
      {children}
    </>
  );
}
