import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";

export const metadata: Metadata = { title: "Entra" };

// FASE 1: només la interfície. La lògica d'autenticació arriba a la Fase 2.
export default function LoginPage() {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <section className="pt-2">
        <h1 className="text-[26px] leading-tight font-bold text-sorli-800">
          Benvinguts a Sorli
        </h1>
        <p className="mt-3 max-w-md text-lg text-tinta-suau">
          Un racó privat per compartir publicacions, fotos, música i desitjos amb
          la gent de sempre.
        </p>
        <p className="mt-6 max-w-md text-sm text-tinta-suau">
          Sorli és només per a membres convidats. Si t&apos;han enviat una
          invitació, obre l&apos;enllaç per crear el teu compte.
        </p>
      </section>

      <Card>
        <CardHeader title="Entra a Sorli" />
        <CardBody>
          <form className="space-y-3">
            <div>
              <Label htmlFor="email">Correu electrònic</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <Label htmlFor="password">Contrasenya</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button type="submit" disabled>
                Entra
              </Button>
              <Link href="/recuperar" className="text-xs">
                Has oblidat la contrasenya?
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
