import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/form";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Entra" };

const MESSAGES: Record<string, { tone: "error" | "info" | "ok"; text: string }> = {
  suspes: { tone: "error", text: "Aquest compte està suspès. Parla amb l'administrador." },
  enllac: { tone: "error", text: "L'enllaç no és vàlid o ha caducat. Torna-ho a provar." },
  sortit: { tone: "info", text: "Has tancat la sessió. Fins aviat!" },
  eliminat: { tone: "info", text: "El teu compte s'ha eliminat. Gràcies per haver format part de Sorli." },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const message = typeof params.error === "string" ? MESSAGES[params.error] : undefined;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <section className="pt-2">
        <h1 className="text-[26px] leading-tight font-bold text-sorli-800">Benvinguts a Sorli</h1>
        <p className="mt-3 max-w-md text-lg text-tinta-suau">
          Un racó privat per compartir publicacions, fotos, música i desitjos amb la gent de
          sempre.
        </p>
        <p className="mt-6 max-w-md text-sm text-tinta-suau">
          Sorli és només per a membres convidats. Si t&apos;han enviat una invitació, obre
          l&apos;enllaç per crear el teu compte.
        </p>
      </section>

      <div className="space-y-3">
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <Card>
          <CardHeader title="Entra a Sorli" />
          <CardBody>
            <LoginForm next={next} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
