"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Notice } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form-state";
import { register } from "../actions";

export function RegisterForm({ token, email }: { token: string; email?: string | null }) {
  const [state, action] = useActionState(register, initialFormState);

  if (state.ok) {
    return (
      <div className="space-y-3">
        <Notice tone="ok">{state.ok}</Notice>
        <Link href="/login" className="text-sm">
          ← Torna a l&apos;inici de sessió
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <input type="hidden" name="token" value={token} />
      <Field
        label="Correu electrònic"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email ?? email ?? ""}
        readOnly={Boolean(email)}
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Nom d'usuari"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        minLength={3}
        maxLength={20}
        defaultValue={state.values?.username}
        errors={state.fieldErrors?.username}
      />
      <p className="-mt-2 text-xs text-tinta-suau">
        Serà la teva adreça: sorli/perfil/<b>nom</b>. No es podrà canviar.
      </p>
      <Field
        label="Contrasenya"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        errors={state.fieldErrors?.password}
      />
      <Field
        label="Repeteix la contrasenya"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.passwordConfirm}
      />
      <SubmitButton pendingText="Creant el compte…">Uneix-te a Sorli</SubmitButton>
    </form>
  );
}
