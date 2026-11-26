"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLinks({ profileHref }: { profileHref: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/inici", label: "Inici", short: "Inici", isActive: pathname === "/inici" },
    {
      href: profileHref,
      label: "El meu perfil",
      short: "Perfil",
      isActive: pathname === profileHref || pathname.startsWith(`${profileHref}/`),
    },
    { href: "/cercador", label: "Cercador", short: "Cerca", isActive: pathname === "/cercador" },
    { href: "/ajustos", label: "Ajustos", short: "Ajustos", isActive: pathname === "/ajustos" },
  ];

  return (
    <nav aria-label="Principal" className="ml-auto flex items-center">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.isActive ? "page" : undefined}
          className={cn(
            "px-2 py-1 text-sm font-bold text-white no-underline hover:bg-sorli-700 hover:no-underline sm:px-2.5",
            l.isActive && "bg-sorli-700",
          )}
        >
          <span className="sm:hidden">{l.short}</span>
          <span className="hidden sm:inline">{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
