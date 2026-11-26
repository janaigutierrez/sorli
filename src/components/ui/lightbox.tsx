"use client";

import { useEffect, useRef } from "react";

/**
 * Visor de fotos a pantalla completa (estil "theater" clàssic).
 * <dialog> natiu: Esc tanca, el focus queda atrapat dins i es retorna en tancar.
 * Fletxes ← → per navegar.
 */
export function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: string[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = index !== null;
  const many = photos.length > 1;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open || !many) return;
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, many, index, photos.length, onIndexChange]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => {
        // clic al fons (fora de la foto) → tanca
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label="Visor de fotos"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/90 p-0 text-white backdrop:bg-black/60"
    >
      {open ? (
        <div className="flex h-full flex-col" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span>{many ? `${index + 1} de ${photos.length}` : null}</span>
            <div className="flex gap-3">
              <a href={photos[index]} target="_blank" rel="noopener" className="text-white/80 hover:text-white">
                Obre l&apos;original ↗
              </a>
              <button type="button" onClick={onClose} className="font-bold hover:text-sorli-200" autoFocus>
                Tanca ✕
              </button>
            </div>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- imatge privada servida via /media */}
            <img src={photos[index]} alt="" className="max-h-full max-w-full object-contain" />
            {many ? (
              <>
                <NavButton side="left" onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)} />
                <NavButton side="right" onClick={() => onIndexChange((index + 1) % photos.length)} />
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Foto següent"}
      className={`absolute top-1/2 -translate-y-1/2 bg-black/50 px-3 py-4 text-2xl hover:bg-black/80 ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
