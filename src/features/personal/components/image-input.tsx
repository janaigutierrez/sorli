"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_IMAGES } from "@/lib/images";

/**
 * Selector d'una imatge amb previsualització. No puja res: el formulari
 * pare decideix quan pujar-la (en desar).
 */
export function ImageInput({
  label,
  preview,
  onPick,
  onClear,
  disabled,
}: {
  label: string;
  preview: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden border border-linia bg-fons text-xl">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- previsualització local o privada
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          "🖼️"
        )}
      </span>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <Button variant="secundari" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
        {label}
      </Button>
      {preview ? (
        <Button variant="enllac" size="sm" disabled={disabled} onClick={onClear}>
          Treu-la
        </Button>
      ) : null}
    </div>
  );
}
