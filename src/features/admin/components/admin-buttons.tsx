"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { deleteComment } from "@/features/posts/actions";
import { deleteMember, revokeInvitation, setMemberRole, setMemberStatus } from "../actions";

/** Botó genèric: confirma, executa l'acció i refresca. */
function ActionButton({
  label,
  confirm,
  run,
  variant = "secundari",
}: {
  label: string;
  confirm?: string;
  run: () => Promise<ActionResult>;
  variant?: "secundari" | "perill" | "enllac";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          const res = await run();
          if (!res.ok) window.alert(res.error);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : label}
    </Button>
  );
}

export function RevokeInvitationButton({ id, note }: { id: string; note: string | null }) {
  return (
    <ActionButton
      label="Revoca"
      variant="enllac"
      confirm={`Vols anul·lar la invitació${note ? ` de «${note}»` : ""}? L'enllaç deixarà de funcionar.`}
      run={() => revokeInvitation(id)}
    />
  );
}

export function MemberActions({
  id,
  name,
  username,
  role,
  status,
}: {
  id: string;
  name: string;
  username: string;
  role: "admin" | "member";
  status: "active" | "suspended";
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {status === "active" ? (
        <ActionButton
          label="Suspèn"
          confirm={`Suspendre ${name}? No podrà entrar fins que el reactivis. El seu contingut es manté.`}
          run={() => setMemberStatus(id, "suspended")}
        />
      ) : (
        <ActionButton label="Reactiva" run={() => setMemberStatus(id, "active")} />
      )}
      {role === "member" ? (
        <ActionButton
          label="Fes admin"
          confirm={`Fer administrador ${name}? Podrà convidar, suspendre i moderar.`}
          run={() => setMemberRole(id, "admin")}
        />
      ) : (
        <ActionButton label="Treu admin" run={() => setMemberRole(id, "member")} />
      )}
      <Button
        size="sm"
        variant="perill"
        onClick={async () => {
          const typed = window.prompt(
            `ELIMINAR DEFINITIVAMENT el compte de ${name} i tot el seu contingut (publicacions, fotos, comentaris…). No es pot desfer.\n\nEscriu «${username}» per confirmar:`,
          );
          if (typed === null) return;
          const res = await deleteMember(id, typed);
          if (!res.ok) window.alert(res.error);
          window.location.reload();
        }}
      >
        Elimina
      </Button>
    </div>
  );
}

export function DeleteCommentButton({ id }: { id: string }) {
  return (
    <ActionButton
      label="Elimina"
      variant="enllac"
      confirm="Vols eliminar aquest comentari?"
      run={() => deleteComment(id)}
    />
  );
}
