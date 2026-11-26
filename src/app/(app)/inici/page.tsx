import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody } from "@/components/ui/card";
import { requireMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Inici" };

export default async function HomePage() {
  const profile = await requireMember();

  return (
    <PageShell>
      <Card>
        <CardBody className="flex items-center gap-3">
          <Avatar name={profile.display_name} size="md" />
          <div>
            <h1 className="text-xl font-bold text-sorli-800">Benvinguts a Sorli</h1>
            <p className="text-tinta-suau">
              Hola, <b>{profile.display_name}</b>
              {profile.role === "admin" ? " · administrador" : null}
            </p>
          </div>
        </CardBody>
      </Card>
      {/* FASE 3: compositor de publicacions + feed cronològic */}
    </PageShell>
  );
}
