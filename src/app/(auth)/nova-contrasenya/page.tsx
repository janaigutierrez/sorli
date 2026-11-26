import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { NewPasswordForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = { title: "Nova contrasenya" };

// S'hi arriba des de l'enllaç del correu de recuperació, que ja obre sessió
// (via /auth/callback). Sense sessió, el proxy redirigeix a /login.
export default function NewPasswordPage() {
  return (
    <div className="mx-auto max-w-[420px]">
      <Card>
        <CardHeader title="Tria una contrasenya nova" />
        <CardBody>
          <NewPasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
