import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/form";
import { RegisterForm } from "@/features/auth/components/register-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Uneix-te" };

export default async function RegisterPage({ params }: PageProps<"/registre/[token]">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: status } = await supabase.rpc("check_invitation", { p_token: token });

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
          <Notice tone="error">
            Aquesta invitació no és vàlida, ja s&apos;ha fet servir o ha caducat. Demana&apos;n
            una de nova a qui te l&apos;ha enviat.
          </Notice>
          <Link href="/login" className="text-sm">
            Ja tens compte? Entra
          </Link>
        </>
      )}
    </div>
  );
}
