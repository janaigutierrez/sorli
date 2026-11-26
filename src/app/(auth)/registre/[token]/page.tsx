import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/form";
import { RegisterForm } from "@/features/auth/components/register-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Uneix-te" };

const MESSAGES: Record<string, { tone: "info" | "error"; text: string }> = {
  used: {
    tone: "info",
    text: "Aquesta invitació ja s'ha fet servir. Si et vas registrar tu amb aquest enllaç, ja pots entrar.",
  },
  expired: {
    tone: "error",
    text: "Aquesta invitació ha caducat. Demana'n una de nova a qui te l'ha enviat.",
  },
  revoked: {
    tone: "error",
    text: "Aquesta invitació s'ha anul·lat. Demana'n una de nova a qui te l'ha enviat.",
  },
  invalid: {
    tone: "error",
    text: "Aquest enllaç d'invitació no és vàlid. Comprova que l'hagis copiat sencer.",
  },
};

export default async function RegisterPage({ params }: PageProps<"/registre/[token]">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: status } = await supabase.rpc("check_invitation", { p_token: token });
  const message = MESSAGES[status ?? "invalid"] ?? MESSAGES.invalid;

  return (
    <div className="mx-auto max-w-[420px] space-y-3">
      <h1 className="text-[22px] font-bold text-sorli-800">Benvinguts a Sorli</h1>

      {status === "ok" ? (
        <Card>
          <CardHeader title="Crea el teu compte" />
          <CardBody>
            <p className="mb-3 text-sm text-tinta-suau">
              Algú t&apos;ha convidat a Sorli. En crear el compte ja formaràs part de la
              comunitat: no cal afegir ningú.
            </p>
            <RegisterForm token={token} />
          </CardBody>
        </Card>
      ) : (
        <>
          <Notice tone={message.tone}>{message.text}</Notice>
          <Link href="/login" className="text-sm">
            Ja tens compte? Entra
          </Link>
        </>
      )}
    </div>
  );
}
