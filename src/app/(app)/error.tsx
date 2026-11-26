"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

/** Error inesperat dins la zona de membres. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[520px] px-3 py-8">
      <Card>
        <CardHeader title="Vaja, alguna cosa ha fallat" />
        <CardBody className="space-y-3">
          <p>No s&apos;ha pogut carregar aquesta pàgina. Torna-ho a provar d&apos;aquí a un moment.</p>
          {error.digest ? <p className="text-xs text-tinta-suau">Codi de l&apos;error: {error.digest}</p> : null}
          <div className="flex gap-2">
            <Button onClick={reset}>Torna-ho a provar</Button>
            <Link
              href="/inici"
              className="inline-flex h-[26px] items-center border border-linia bg-[#f4f6f6] px-3 text-sm font-bold text-tinta no-underline hover:no-underline"
            >
              Ves a l&apos;inici
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
