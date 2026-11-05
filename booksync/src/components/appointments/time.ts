import { TZDate } from "@date-fns/tz";

/** Date + heure saisies (heure locale de l'entreprise) → instant ISO UTC. */
export function localInputToIso(date: string, time: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, timeZone).getTime()).toISOString();
}

/** Minuit local d'une date AAAA-MM-JJ, en instant UTC. */
export function localMidnight(date: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, 0, 0, 0, timeZone).getTime());
}

export function todayInTz(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

export function shiftDate(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export function startOfWeek(date: string) {
  return shiftDate(date, 1 - weekdayOf(date));
}

export function startOfMonth(date: string) {
  return `${date.slice(0, 8)}01`;
}

export function daysInMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Minutes depuis minuit (heure locale) d'un instant. */
export function minutesOfDay(iso: string, timeZone: string) {
  const t = new TZDate(new Date(iso).getTime(), timeZone);
  return t.getHours() * 60 + t.getMinutes();
}

export function dateOf(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
}
