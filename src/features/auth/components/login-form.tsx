"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Notice } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form-state";
import { login } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, initialFormState);

  return (
    <form action={action} className="space-y-3" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="Correu electrònic"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Contrasenya"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <div className="flex items-center justify-between pt-1">
        <SubmitButton pendingText="Entrant…">Entra</SubmitButton>
        <Link href="/recuperar" className="text-xs">
          Has oblidat la contrasenya?
        </Link>
      </div>
    </form>
  );
}
