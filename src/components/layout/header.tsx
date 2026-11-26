import Link from "next/link";
import { NavLinks } from "./nav-links";

/**
 * Capçalera horitzontal amb degradat turquesa.
 * `profileHref` i `unreadCount` arriben del servidor.
 */
export function Header({
  profileHref,
  unreadCount = 0,
}: {
  profileHref?: string;
  unreadCount?: number;
}) {
  return (
    <header className="bg-capcalera border-b border-sorli-800 text-white">
      <div className="mx-auto flex h-[42px] max-w-[980px] items-center gap-3 px-3">
        <Link
          href="/inici"
          className="text-[22px] leading-none font-bold tracking-tight text-white no-underline hover:no-underline"
        >
          sorli
        </Link>

        <Link
          href="/notificacions"
          title="Notificacions"
          aria-label={
            unreadCount > 0 ? `Notificacions: ${unreadCount} sense llegir` : "Notificacions"
          }
          className="relative px-1 text-lg leading-none text-white no-underline hover:no-underline"
        >
          🔔
          {unreadCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 min-w-4 border border-[#8f2c2c] bg-perill px-0.5 text-center text-[10px] leading-[14px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>

        <form action="/cercador" className="hidden sm:block" role="search">
          <label htmlFor="q" className="sr-only">
            Cerca membres
          </label>
          <input
            id="q"
            name="q"
            placeholder="Cerca membres"
            className="h-[22px] w-48 border border-sorli-800 bg-white px-1.5 text-sm text-tinta placeholder:text-tinta-suau focus:outline-none md:w-56"
          />
        </form>

        <NavLinks profileHref={profileHref ?? "/perfil"} />
      </div>
    </header>
  );
}
