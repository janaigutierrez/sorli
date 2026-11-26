import type { ReactNode } from "react";

/**
 * Graella de tres columnes de les xarxes clàssiques:
 * lateral esquerra (navegació secundària) · contingut · lateral dreta.
 * En mòbil les columnes s'apilen i les laterals passen a sota.
 */
export function PageShell({
  left,
  right,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-3 px-3 py-3 md:flex-row md:items-start">
      {left ? <aside className="order-2 md:order-1 md:w-[180px] md:shrink-0">{left}</aside> : null}
      <main className="order-1 min-w-0 flex-1 md:order-2">{children}</main>
      {right ? <aside className="order-3 md:w-[240px] md:shrink-0">{right}</aside> : null}
    </div>
  );
}
