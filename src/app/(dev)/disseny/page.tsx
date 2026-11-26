import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/components/layout/page-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, Separator } from "@/components/ui/card";
import { FieldError, Input, Label, Notice, Textarea } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Sistema de disseny" };

const swatches = [
  ["sorli-50", "bg-sorli-50"],
  ["sorli-100", "bg-sorli-100"],
  ["sorli-300", "bg-sorli-300"],
  ["sorli-500", "bg-sorli-500"],
  ["sorli-700", "bg-sorli-700"],
  ["mar-300", "bg-mar-300"],
  ["mar-500", "bg-mar-500"],
  ["escuma-300", "bg-escuma-300"],
  ["escuma-500", "bg-escuma-500"],
  ["fons", "bg-fons"],
  ["linia", "bg-linia"],
  ["tinta-suau", "bg-tinta-suau"],
] as const;

/** Guia d'estil viva. Només existeix en desenvolupament. */
export default function DissenyPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <Header profileHref="/perfil/janai" />
      <PageShell
        left={
          <nav className="space-y-0.5 text-sm">
            {["Novetats", "El meu mur", "Fotos", "Wishes", "Música"].map((x, i) => (
              <a
                key={x}
                href="#"
                className={`block px-2 py-1 font-bold no-underline hover:bg-sorli-50 ${i === 0 ? "bg-sorli-100 text-sorli-800" : "text-tinta"}`}
              >
                {x}
              </a>
            ))}
          </nav>
        }
        right={
          <Card>
            <CardHeader title="Membres" action={<a href="#">Veure tots</a>} />
            <CardBody className="grid grid-cols-3 gap-2">
              {["Janai G", "Marta P", "Pol R", "Laia S", "Arnau T"].map((n) => (
                <div key={n} className="text-center text-xs">
                  <Avatar name={n} size="md" />
                  <div className="mt-0.5 truncate">{n.split(" ")[0]}</div>
                </div>
              ))}
            </CardBody>
          </Card>
        }
      >
        <div className="space-y-3">
          <Card>
            <CardBody>
              <h1 className="text-xl font-bold text-sorli-800">Benvinguts a Sorli</h1>
              <p className="text-tinta-suau">Guia d&apos;estil · Fase 1</p>
            </CardBody>
          </Card>

          {/* Compositor de publicació */}
          <Card>
            <CardBody className="space-y-2">
              <Textarea placeholder="Què hi ha de nou?" />
              <div className="flex justify-between">
                <Button variant="secundari" size="sm">Afegeix fotos</Button>
                <Button>Publica</Button>
              </div>
            </CardBody>
          </Card>

          {/* Publicació d'exemple */}
          <Card>
            <CardBody className="flex gap-2.5">
              <Avatar name="Marta P" />
              <div className="min-w-0 flex-1">
                <p>
                  <a href="#" className="font-bold">Marta P</a>
                  <span className="text-tinta-suau"> ▸ </span>
                  <a href="#" className="font-bold">Janai G</a>
                </p>
                <p className="mt-0.5">Per molts anys!! Ja he vist la teva wishlist 👀</p>
                <p className="mt-1 text-xs text-tinta-suau">
                  dimecres a les 21:14 · <a href="#">M&apos;agrada</a> · <a href="#">Comenta</a>
                </p>
                <div className="mt-2 space-y-px">
                  <div className="bg-sorli-50 px-2 py-1 text-xs">👍 A Pol R i 2 persones més els agrada això.</div>
                  <div className="flex gap-2 bg-sorli-50 px-2 py-1.5">
                    <Avatar name="Pol R" size="xs" />
                    <p className="text-sm">
                      <a href="#" className="font-bold">Pol R</a> Jo ja tinc el regal 🎁
                      <span className="block text-xs text-tinta-suau">fa 2 hores · <a href="#">Respon</a></span>
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pestanyes de perfil" />
            <CardBody>
              <Tabs
                items={[
                  { href: "/disseny", label: "Mur", active: true },
                  { href: "#fotos", label: "Fotos" },
                  { href: "#wishes", label: "Wishes" },
                  { href: "#musica", label: "Música" },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Botons i formularis" />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button>Primari</Button>
                <Button variant="secundari">Secundari</Button>
                <Button variant="perill">Elimina</Button>
                <Button variant="enllac">Enllaç</Button>
                <Button disabled>Desactivat</Button>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="d1">Nom d&apos;usuari</Label>
                  <Input id="d1" placeholder="janai" />
                </div>
                <div>
                  <Label htmlFor="d2">Correu</Label>
                  <Input id="d2" aria-invalid defaultValue="no-es-un-correu" />
                  <FieldError>Introdueix un correu vàlid.</FieldError>
                </div>
              </div>
              <Notice>Missatge informatiu.</Notice>
              <Notice tone="ok">Canvis desats.</Notice>
              <Notice tone="error">No s&apos;ha pogut publicar.</Notice>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Paleta" />
            <CardBody className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {swatches.map(([name, cls]) => (
                <div key={name} className="text-xs">
                  <div className={`h-10 border border-linia ${cls}`} />
                  {name}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </PageShell>
    </>
  );
}
