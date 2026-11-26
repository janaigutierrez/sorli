"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLinks({ profileHref }: { profileHref: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/inici", label: "Inici" },
    { href: profileHref, label: "El meu perfil", match: "/perfil" },
    { href: "/cercador", label: "Cercador" },
    { href: "/ajustos", label: "Ajustos" },
  ];

  return (
    <nav aria-label="Principal" className="ml-auto flex items-center">
      {links.map((l) => {
        const active =
          pathname === l.href || pathname.startsWith(`${l.match ?? l.href}/`) || pathname === l.match;
        return (
          <Link
            key={l.label}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "px-2.5 py-1 text-sm font-bold text-white no-underline hover:bg-sorli-700 hover:no-underline",
              active && "bg-sorli-700",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
