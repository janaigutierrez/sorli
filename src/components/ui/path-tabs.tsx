"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "./tabs";

/** Pestanyes que marquen com a activa la que coincideix amb la URL actual. */
export function PathTabs({
  items,
  className,
}: {
  items: { href: string; label: string }[];
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <Tabs items={items.map((t) => ({ ...t, active: pathname === t.href }))} className={className} />
  );
}
