/** Estat de càrrega de la zona de membres (es mostra mentre el servidor respon). */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[980px] px-3 py-3" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-2.5 border border-linia bg-paper p-3">
            <div className="size-10 shrink-0 bg-linia-suau" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2.5 w-1/3 bg-linia-suau" />
              <div className="h-2.5 w-4/5 bg-linia-suau" />
              <div className="h-2.5 w-2/3 bg-linia-suau" />
            </div>
          </div>
        ))}
        <p className="text-center text-xs text-tinta-suau">Carregant…</p>
      </div>
    </div>
  );
}
