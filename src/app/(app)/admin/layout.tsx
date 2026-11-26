import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PathTabs } from "@/components/ui/path-tabs";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Administració", template: "%s · Admin · Sorli" } };

/**
 * Zona d'administració. requireAdmin() dona un 404 a qui no és admin,
 * però la protecció real són les RLS i les funcions SQL (comproven is_admin).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[980px] space-y-3 px-3 py-3">
      <div className="border border-linia bg-paper">
        <h1 className="px-3 pt-2.5 pb-1.5 text-xl font-bold text-sorli-800">⚙️ Administració de Sorli</h1>
        <PathTabs
          className="px-3"
          items={[
            { href: "/admin", label: "Invitacions" },
            { href: "/admin/membres", label: "Membres" },
            { href: "/admin/moderacio", label: "Moderació" },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
