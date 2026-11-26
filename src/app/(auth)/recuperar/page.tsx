import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ResetRequestForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = { title: "Recupera la contrasenya" };

export default function RecoverPage() {
  return (
    <div className="mx-auto max-w-[420px] space-y-3">
      <Card>
        <CardHeader title="Has oblidat la contrasenya?" />
        <CardBody className="space-y-3">
          <p className="text-sm text-tinta-suau">
            Escriu el teu correu i t&apos;enviarem un enllaç per triar-ne una de nova.
          </p>
          <ResetRequestForm />
        </CardBody>
      </Card>
      <Link href="/login" className="text-sm">
        ← Torna a l&apos;inici de sessió
      </Link>
    </div>
  );
}
