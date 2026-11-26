import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { requireMember } from "@/lib/auth";

/** Zona de membres: tota pàgina aquí dins requereix un membre actiu. */
export default async function MembersLayout({ children }: { children: ReactNode }) {
  const profile = await requireMember();

  return (
    <>
      <Header profileHref={`/perfil/${profile.username}`} />
      {children}
    </>
  );
}
