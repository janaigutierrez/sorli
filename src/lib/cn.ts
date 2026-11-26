/** Uneix classes ignorant valors falsos. Sense dependències externes. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
