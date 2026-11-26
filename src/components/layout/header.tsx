import Link from "next/link";
import { NavLinks } from "./nav-links";

/**
 * Capçalera horitzontal amb degradat turquesa.
 * `profileHref` arriba del servidor (username de l'usuari autenticat).
 */
export function Header({ profileHref }: { profileHref?: string }) {
  return (
    <header className="bg-capcalera border-b border-sorli-800 text-white">
      <div className="mx-auto flex h-[42px] max-w-[980px] items-center gap-4 px-3">
        <Link
          href="/inici"
          className="text-[22px] leading-none font-bold tracking-tight text-white no-underline hover:no-underline"
        >
          sorli
        </Link>

        <form action="/cercador" className="hidden sm:block" role="search">
          <label htmlFor="q" className="sr-only">
            Cerca membres
          </label>
          <input
            id="q"
            name="q"
            placeholder="Cerca membres"
            className="h-[22px] w-56 border border-sorli-800 bg-white px-1.5 text-sm text-tinta placeholder:text-tinta-suau focus:outline-none"
          />
        </form>

        <NavLinks profileHref={profileHref ?? "/perfil"} />
      </div>
    </header>
  );
}
