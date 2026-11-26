import Link from "next/link";

/** 404 global (també és el que veu un no-admin a /admin). */
export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <header className="bg-capcalera border-b border-sorli-800">
        <div className="mx-auto flex h-[42px] max-w-[980px] items-center px-3">
          <Link href="/inici" className="text-[22px] font-bold text-white no-underline hover:no-underline">
            sorli
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[520px] px-3 py-10">
        <div className="border border-linia bg-paper p-5 text-center">
          <p className="text-4xl">🌊</p>
          <h1 className="mt-2 text-xl font-bold text-sorli-800">Aquesta pàgina no existeix</h1>
          <p className="mt-1 text-tinta-suau">
            Potser l&apos;enllaç és incorrecte o el contingut s&apos;ha eliminat.
          </p>
          <Link href="/inici" className="mt-4 inline-block font-bold">
            ← Torna a l&apos;inici
          </Link>
        </div>
      </main>
    </div>
  );
}
