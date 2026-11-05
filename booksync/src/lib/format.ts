import { TZDate } from "@date-fns/tz";
import { format, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";

export const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatCents(cents: number) {
  return EUR.format(cents / 100);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/** Formate une date dans le fuseau de l'entreprise (jamais celui du serveur). */
export function formatInTz(date: Date | string, timeZone: string, pattern: string) {
  return format(new TZDate(new Date(date), timeZone), pattern, { locale: fr });
}

export function formatDateLong(date: Date | string, tz: string) {
  return formatInTz(date, tz, "EEEE d MMMM yyyy");
}

export function formatTime(date: Date | string, tz: string) {
  return formatInTz(date, tz, "HH:mm");
}

export function formatDateTime(date: Date | string, tz: string) {
  return formatInTz(date, tz, "EEE d MMM yyyy 'à' HH:mm");
}

export function fromNow(date: Date | string) {
  return formatDistanceToNowStrict(new Date(date), { locale: fr, addSuffix: true });
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function minutesToHHMM(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function hhmmToMinutes(v: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}
