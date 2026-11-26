/**
 * Dates a l'estil de les xarxes clàssiques, en català i a l'hora de Barcelona
 * (el servidor de Netlify va en UTC: per això fixem la zona horària).
 */
const TZ = "Europe/Madrid";

const time = new Intl.DateTimeFormat("ca", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const weekday = new Intl.DateTimeFormat("ca", { timeZone: TZ, weekday: "long" });
const dayMonth = new Intl.DateTimeFormat("ca", { timeZone: TZ, day: "numeric", month: "long" });
const dayMonthYear = new Intl.DateTimeFormat("ca", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // YYYY-MM-DD

function dayDiff(a: Date, b: Date) {
  const da = Date.parse(ymd.format(a));
  const db = Date.parse(ymd.format(b));
  return Math.round((db - da) / 86_400_000);
}

/** "ara mateix" · "fa 5 minuts" · "fa 3 hores" · "ahir a les 21:14" · "dimecres a les 21:14" · "3 de març a les 10:02" */
export function formatPostDate(iso: string, now = new Date()) {
  const d = new Date(iso);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "ara mateix";
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return m === 1 ? "fa 1 minut" : `fa ${m} minuts`;
  }
  const days = dayDiff(d, now);
  if (days === 0) {
    const h = Math.floor(seconds / 3600);
    return h === 1 ? "fa 1 hora" : `fa ${h} hores`;
  }
  if (days === 1) return `ahir a les ${time.format(d)}`;
  if (days < 7) return `${weekday.format(d)} a les ${time.format(d)}`;

  const sameYear = d.getUTCFullYear() === now.getUTCFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(d)} a les ${time.format(d)}`;
}

/** Data llarga per a tooltips: "dimecres, 26 de novembre de 2026, 01:20" */
export function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("ca", {
    timeZone: TZ,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Aniversari sense any: "12 de març". `date` ve com "YYYY-MM-DD". */
export function formatBirthday(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("ca", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, m - 1, d)),
  );
}
