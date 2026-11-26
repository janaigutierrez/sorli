import type { ComponentProps, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const field =
  "w-full border border-linia bg-paper px-2 py-1 text-base text-tinta rounded-sm " +
  "placeholder:text-tinta-suau focus:border-mar-500 focus:outline-none " +
  "aria-[invalid=true]:border-perill";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-[26px]", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-16 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(field, "h-[26px] py-0", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-bold text-tinta-suau", className)}
      {...props}
    />
  );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-0.5 text-xs text-perill">
      {children}
    </p>
  );
}

/** Label + input + error, amb l'accessibilitat lligada (aria-invalid/aria-describedby). */
export function Field({
  label,
  name,
  errors,
  className,
  ...props
}: ComponentProps<"input"> & {
  label: string;
  name: string;
  errors?: string[];
}) {
  const id = props.id ?? name;
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      <FieldError id={errorId}>{errors?.[0]}</FieldError>
    </div>
  );
}

/** Missatge de bloc (error general d'un formulari o confirmació). */
export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "ok";
  children: ReactNode;
}) {
  const tones = {
    info: "border-mar-300 bg-mar-100 text-mar-700",
    error: "border-[#e3b4b4] bg-perill-fons text-perill",
    ok: "border-escuma-300 bg-escuma-100 text-escuma-600",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("border px-3 py-2 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
