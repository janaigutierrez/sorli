import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { logout } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Ajustos" };

// FASE 2: només tancar sessió. Correu, contrasenya, notificacions i
// eliminar compte arriben a la Fase 3 (navegació).
export default function SettingsPage() {
  return (
    <PageShell>
      <Card>
        <CardHeader title="Ajustos del compte" />
        <CardBody>
          <form action={logout}>
            <Button type="submit" variant="secundari">
              Tanca la sessió
            </Button>
          </form>
        </CardBody>
      </Card>
    </PageShell>
  );
}
