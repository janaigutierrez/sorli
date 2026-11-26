import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primari" | "secundari" | "perill" | "enllac";

const variants: Record<Variant, string> = {
  primari:
    "border border-sorli-700 bg-sorli-500 text-white font-bold hover:bg-sorli-600 active:bg-sorli-700",
  secundari:
    "border border-linia bg-[#f4f6f6] text-tinta font-bold hover:bg-linia-suau active:bg-linia",
  perill:
    "border border-[#8f2c2c] bg-perill text-white font-bold hover:bg-[#9a3232]",
  enllac:
    "border border-transparent bg-transparent text-sorli-700 hover:underline px-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

/** Botó senzill, pla, amb vora fina: estil clàssic. */
export function Button({
  variant = "primari",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-sm leading-none whitespace-nowrap",
        "disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "h-6 px-2 text-xs" : "h-[26px] px-3 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
