import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { logout } from "@/features/auth/actions";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { getUnreadCount } from "@/features/notifications/queries";
import {
  ChangeEmailForm,
  ChangePasswordForm,
  DeleteAccountForm,
} from "@/features/settings/components/settings-forms";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ajustos" };

const SECTIONS = [
  ["correu", "Correu electrònic"],
  ["contrasenya", "Contrasenya"],
  ["privacitat", "Privacitat"],
  ["notificacions", "Notificacions"],
  ["sessio", "Sessió"],
  ["eliminar", "Eliminar compte"],
] as const;

/** Ajustos del COMPTE. Les dades personals del perfil s'editen al perfil. */
export default async function SettingsPage() {
  const me = await requireMember();
  const supabase = await createClient();
  const [{ data }, unread] = await Promise.all([supabase.auth.getUser(), getUnreadCount()]);

  return (
    <PageShell
      left={
        <nav aria-label="Seccions dels ajustos" className="space-y-0.5 text-sm">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="block px-2 py-1 font-bold text-tinta no-underline hover:bg-sorli-50">
              {label}
            </a>
          ))}
        </nav>
      }
    >
      <div className="space-y-3">
        <Section id="correu" title="Correu electrònic">
          <ChangeEmailForm currentEmail={data.user?.email ?? ""} />
        </Section>

        <Section id="contrasenya" title="Contrasenya">
          <ChangePasswordForm />
        </Section>

        <Section id="privacitat" title="Privacitat">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Sorli és privat: res del que publiques és visible sense iniciar sessió.</li>
            <li>Tots els membres de Sorli poden veure el teu perfil i les teves publicacions.</li>
            <li>No hi ha amistats ni sol·licituds: una invitació vàlida dona accés a tota la comunitat.</li>
          </ul>
          <p className="mt-2 text-xs text-tinta-suau">
            Les teves dades personals (nom, foto, aniversari…) es canvien a{" "}
            <Link href={`/perfil/${me.username}/editar`}>Edita el perfil</Link>.
          </p>
        </Section>

        <Section id="notificacions" title="Notificacions">
          <p className="text-sm">
            Les notificacions de Sorli es mostren dins l&apos;app (🔔 a la capçalera): quan algú escriu
            al teu mur, comenta o respon, o li agrada una publicació teva. Es marquen com a llegides quan les obres. No t&apos;enviem correus.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Link href="/notificacions" className="text-sm">
              Veure-les ({unread} sense llegir)
            </Link>
            {unread > 0 ? (
              <form action={markAllNotificationsRead}>
                <Button type="submit" variant="secundari" size="sm">
                  Marca-les totes com a llegides
                </Button>
              </form>
            ) : null}
          </div>
        </Section>

        {me.role === "admin" ? (
          <Section id="admin" title="Administració">
            <p className="text-sm">
              Ets administrador de Sorli. <Link href="/admin">⚙️ Obre el panell d&apos;administració</Link>{" "}
              (invitacions, membres i moderació).
            </p>
          </Section>
        ) : null}

        <Section id="sessio" title="Sessió">
          <form action={logout}>
            <Button type="submit" variant="secundari">
              Tanca la sessió
            </Button>
          </form>
        </Section>

        <Section id="eliminar" title="Eliminar compte">
          <DeleteAccountForm username={me.username} />
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-3">
      <CardHeader title={title} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}
