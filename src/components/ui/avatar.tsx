import { cn } from "@/lib/cn";

const sizes = {
  xs: "size-8 text-xs", // comentaris
  sm: "size-10 text-sm", // publicacions
  md: "size-[50px] text-base", // llistes, cercador
  lg: "size-[120px] text-3xl sm:size-[160px] sm:text-4xl", // perfil
} as const;

/**
 * Avatar QUADRAT (com les xarxes clàssiques).
 * Sense foto, mostra les inicials sobre turquesa suau.
 */
export function Avatar({
  src,
  name,
  size = "sm",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border border-linia bg-sorli-100 font-bold text-sorli-700",
        sizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs signades de Supabase Storage
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <span aria-label={name}>{initials || "?"}</span>
      )}
    </span>
  );
}
