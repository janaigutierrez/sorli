"use client";

import { useActionState } from "react";
import { Field, Notice } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form-state";
import { requestPasswordReset, updatePassword } from "../actions";

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);

  if (state.ok) return <Notice tone="ok">{state.ok}</Notice>;

  return (
    <form action={action} className="space-y-3" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field
        label="Correu electrònic"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <SubmitButton pendingText="Enviant…">Envia&apos;m l&apos;enllaç</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);

  return (
    <form action={action} className="space-y-3" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field
        label="Nova contrasenya"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        errors={state.fieldErrors?.password}
      />
      <Field
        label="Repeteix-la"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.passwordConfirm}
      />
      <SubmitButton pendingText="Desant…">Desa la contrasenya</SubmitButton>
    </form>
  );
}
