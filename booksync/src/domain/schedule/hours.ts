/**
 * Plages horaires hebdomadaires (heure locale). Logique pure et testée.
 * weekday : 1 = lundi … 7 = dimanche. Minutes depuis minuit.
 */

export type Range = { startMinute: number; endMinute: number };
export type WeeklyHours = Record<number, Range[]>;

export const WEEKDAYS = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 7, label: "Dimanche", short: "Dim" },
] as const;

export function emptyWeek(): WeeklyHours {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
}

export function groupByWeekday(rows: Array<{ weekday: number } & Range>): WeeklyHours {
  const week = emptyWeek();
  for (const r of rows) week[r.weekday].push({ startMinute: r.startMinute, endMinute: r.endMinute });
  for (const d of Object.keys(week)) week[Number(d)].sort((a, b) => a.startMinute - b.startMinute);
  return week;
}

export type HoursError = { weekday: number; message: string };

/** Vérifie une semaine : plages valides, ordonnées et sans chevauchement. */
export function validateWeek(week: WeeklyHours): HoursError | null {
  for (const { value, label } of WEEKDAYS) {
    const ranges = [...(week[value] ?? [])].sort((a, b) => a.startMinute - b.startMinute);
    if (ranges.length > 6) return { weekday: value, message: `${label} : 6 plages maximum.` };
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (!Number.isInteger(r.startMinute) || !Number.isInteger(r.endMinute) || r.startMinute < 0 || r.endMinute > 1440) {
        return { weekday: value, message: `${label} : horaire invalide.` };
      }
      if (r.startMinute >= r.endMinute) {
        return { weekday: value, message: `${label} : l'heure de fin doit être après l'heure de début.` };
      }
      if (i > 0 && r.startMinute < ranges[i - 1].endMinute) {
        return { weekday: value, message: `${label} : deux plages se chevauchent.` };
      }
    }
  }
  return null;
}

export function weekToRows(week: WeeklyHours) {
  return WEEKDAYS.flatMap(({ value }) => (week[value] ?? []).map((r) => ({ weekday: value, ...r })));
}

/** Résumé lisible : « 9:00–12:00, 14:00–18:00 » ou « Fermé ». */
export function describeDay(ranges: Range[]) {
  if (!ranges.length) return "Fermé";
  const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  return ranges.map((r) => `${fmt(r.startMinute)}–${fmt(r.endMinute)}`).join(", ");
}
