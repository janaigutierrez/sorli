/** Estat que retornen les Server Actions de formularis (per a useActionState). */
export type FormState = {
  /** Error general (no lligat a cap camp). */
  error?: string;
  /** Errors per camp, generats amb zod. */
  fieldErrors?: Record<string, string[] | undefined>;
  /** Missatge d'èxit (quan no hi ha redirecció). */
  ok?: string;
  /** Valors enviats, per repoblar el formulari si hi ha error (mai contrasenyes). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};
