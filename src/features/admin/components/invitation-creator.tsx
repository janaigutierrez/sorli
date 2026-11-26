"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Notice, Select } from "@/components/ui/form";
import { createInvitation } from "../actions";

export function InvitationCreator() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [days, setDays] = useState("7");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createInvitation({ note, email, role, days });
      if (!res.ok) return setError(res.error);
      setLink(res.data.link);
      setCopied(false);
      router.refresh();
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (link) {
    return (
      <div className="space-y-2">
        <Notice tone="ok">
          Invitació creada{note ? ` per a «${note}»` : ""}. <b>Copia l&apos;enllaç ara:</b> per seguretat no
          es tornarà a mostrar (només en guardem una empremta).
        </Notice>
        <div className="flex gap-2">
          <Input readOnly value={link} aria-label="Enllaç d'invitació" onFocus={(e) => e.target.select()} />
          <Button onClick={copy}>{copied ? "Copiat ✓" : "Copia"}</Button>
        </div>
        <Button
          variant="enllac"
          size="sm"
          onClick={() => {
            setLink(null);
            setNote("");
            setEmail("");
            setRole("member");
          }}
        >
          Crea&apos;n una altra
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2.5" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Per a qui és? (nota interna)" name="note" placeholder="La Marta" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        <Field
          label="Correu (opcional: només aquest podrà usar-la)"
          name="email"
          type="email"
          placeholder="marta@exemple.cat"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <Label htmlFor="inv-role">Rol</Label>
          <Select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as "member" | "admin")}>
            <option value="member">Membre</option>
            <option value="admin">Administrador</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="inv-days">Caduca en</Label>
          <Select id="inv-days" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="1">1 dia</option>
            <option value="3">3 dies</option>
            <option value="7">7 dies</option>
            <option value="14">14 dies</option>
            <option value="30">30 dies</option>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creant…" : "Genera l'enllaç d'invitació"}
      </Button>
    </form>
  );
}
