import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Targeta blanca amb vora fina: la unitat bàsica de tota la interfície. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-linia bg-paper rounded-sm", className)}
      {...props}
    />
  );
}

/** Capçalera de bloc a l'estil clàssic: franja grisa amb títol en negreta. */
export function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-linia-suau bg-[#f2f5f5] px-3 py-1.5",
        className,
      )}
    >
      <h2 className="text-sm font-bold text-tinta">{title}</h2>
      {action ? <div className="text-xs">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-3", className)} {...props} />;
}

/** Separador horitzontal fi. */
export function Separator({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-linia-suau", className)} />;
}
