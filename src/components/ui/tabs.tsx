import Link from "next/link";
import { cn } from "@/lib/cn";

export interface TabItem {
  href: string;
  label: string;
  active?: boolean;
}

/**
 * Pestanyes clàssiques basades en enllaços (cada pestanya és una URL,
 * així es poden compartir i el botó enrere funciona).
 */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  return (
    <nav aria-label="Seccions" className={cn("flex gap-0.5 border-b border-linia", className)}>
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "-mb-px border border-b-0 px-3 py-1.5 text-sm font-bold no-underline hover:no-underline",
            t.active
              ? "border-linia bg-paper text-tinta"
              : "border-transparent text-sorli-700 hover:bg-linia-suau",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
