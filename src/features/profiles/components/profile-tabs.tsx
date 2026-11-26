"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

export function ProfileTabs({ username }: { username: string }) {
  const pathname = usePathname();
  const base = `/perfil/${username}`;
  const items = [
    { href: base, label: "Mur" },
    { href: `${base}/fotos`, label: "Fotos" },
    { href: `${base}/wishes`, label: "Wishes" },
    { href: `${base}/musica`, label: "Música" },
  ].map((t) => ({ ...t, active: pathname === t.href }));

  return <Tabs items={items} className="px-3" />;
}
