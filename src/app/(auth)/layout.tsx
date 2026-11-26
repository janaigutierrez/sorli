import Link from "next/link";
import type { ReactNode } from "react";

/** Layout de les pantalles sense sessió (login, registre, recuperació). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="bg-capcalera border-b border-sorli-800">
        <div className="mx-auto flex h-[82px] max-w-[980px] items-end px-3 pb-3">
          <Link
            href="/login"
            className="text-[34px] leading-none font-bold tracking-tight text-white no-underline hover:no-underline"
          >
            sorli
          </Link>
        </div>
      </header>
      <div className="bg-gradient-to-b from-sorli-50 to-fons">
        <div className="mx-auto max-w-[980px] px-3 py-8">{children}</div>
      </div>
    </div>
  );
}
