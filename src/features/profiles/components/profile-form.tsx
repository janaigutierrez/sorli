"use client";

import { useActionState } from "react";
import { Field, FieldError, Label, Notice, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/form-state";
import type { Profile } from "@/types/database";
import { updateProfile } from "../actions";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  const v = state.values;

  return (
    <form action={action} className="space-y-3" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}

      <Field
        label="Nom"
        name="display_name"
        required
        maxLength={60}
        defaultValue={v?.display_name ?? profile.display_name}
        errors={state.fieldErrors?.display_name}
      />
      <div>
        <Label htmlFor="bio">Sobre mi</Label>
        <Textarea
          id="bio"
          name="bio"
          maxLength={500}
          defaultValue={v?.bio ?? profile.bio ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.bio) || undefined}
        />
        <FieldError>{state.fieldErrors?.bio?.[0]}</FieldError>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Ciutat"
          name="city"
          maxLength={80}
          defaultValue={v?.city ?? profile.city ?? ""}
          errors={state.fieldErrors?.city}
        />
        <Field
          label="Aniversari"
          name="birthday"
          type="date"
          defaultValue={v?.birthday ?? profile.birthday ?? ""}
          errors={state.fieldErrors?.birthday}
        />
      </div>
      <p className="text-xs text-tinta-suau">
        El nom d&apos;usuari (@{profile.username}) no es pot canviar.
      </p>
      <SubmitButton pendingText="Desant…">Desa els canvis</SubmitButton>
    </form>
  );
}
