"use client";

import { useActionState } from "react";
import { Field, Notice } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form-state";
import { changeEmail, changePassword, deleteAccount } from "../actions";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action] = useActionState(changeEmail, initialFormState);
  return (
    <form action={action} className="space-y-2" noValidate>
      <p className="text-sm">
        Correu actual: <b>{currentEmail}</b>
      </p>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <Field label="Correu nou" name="email" type="email" autoComplete="email" required errors={state.fieldErrors?.email} />
      <SubmitButton size="sm" pendingText="Enviant…">Canvia el correu</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, initialFormState);
  return (
    <form action={action} className="space-y-2" noValidate key={state.ok ? "ok" : "form"}>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <Field label="Contrasenya actual" name="current" type="password" autoComplete="current-password" required errors={state.fieldErrors?.current} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Contrasenya nova" name="password" type="password" autoComplete="new-password" required minLength={8} errors={state.fieldErrors?.password} />
        <Field label="Repeteix-la" name="passwordConfirm" type="password" autoComplete="new-password" required errors={state.fieldErrors?.passwordConfirm} />
      </div>
      <SubmitButton size="sm" pendingText="Desant…">Canvia la contrasenya</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ username }: { username: string }) {
  const [state, action] = useActionState(deleteAccount, initialFormState);
  return (
    <form action={action} className="space-y-2" noValidate>
      <p className="text-sm">
        S&apos;esborraran <b>definitivament</b> el teu perfil, publicacions, comentaris, m&apos;agrades i
        fotos. No es pot desfer.
      </p>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field
        label={`Escriu «${username}» per confirmar`}
        name="confirm"
        autoComplete="off"
        autoCapitalize="none"
        errors={state.fieldErrors?.confirm}
      />
      <SubmitButton variant="perill" size="sm" pendingText="Eliminant…">
        Elimina el meu compte
      </SubmitButton>
    </form>
  );
}
