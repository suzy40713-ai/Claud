/**
 * Moteur de disponibilités BookSync — logique pure (aucun accès base ni réseau).
 *
 * Principes :
 * - Les horaires sont exprimés en heure LOCALE de l'entreprise ; les rendez-vous et absences en UTC.
 * - Un créneau [début, début + durée) doit tenir entièrement dans une plage de travail.
 * - La période bloquée [début, début + durée + battement) ne doit chevaucher aucune occupation.
 * - Les heures inexistantes (passage à l'heure d'été) sont ignorées ; les heures doublées
 *   (passage à l'heure d'hiver) ne produisent jamais deux créneaux au même instant.
 */
import { TZDate } from "@date-fns/tz";
import type { WeeklyHours } from "@/domain/schedule/hours";

export type Interval = { start: Date; end: Date };

export type StaffAvailabilityInput = {
  id: string;
  week: WeeklyHours;
  /** Rendez-vous (avec battement) et absences de cet employé. */
  busy: Interval[];
};

export type AvailabilityInput = {
  timeZone: string;
  /** Dates locales AAAA-MM-JJ, incluses. */
  fromDate: string;
  toDate: string;
  now: Date;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
  durationMinutes: number;
  bufferAfterMinutes: number;
  staff: StaffAvailabilityInput[];
  /** Fermetures de l'entreprise (s'appliquent à tous). */
  closures: Interval[];
};

export type Slot = { start: Date; staffIds: string[] };
export type DaySlots = { date: string; slots: Slot[] };

const MINUTE = 60_000;

export function parseIsoDate(date: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Date invalide : ${date}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function addDays(date: string, days: number) {
  const { y, m, d } = parseIsoDate(date);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Jour ISO (1 = lundi … 7 = dimanche) d'une date calendaire. */
export function isoWeekday(date: string) {
  const { y, m, d } = parseIsoDate(date);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** Date locale AAAA-MM-JJ d'un instant dans un fuseau. */
export function localDateOf(instant: Date, timeZone: string) {
  const t = new TZDate(instant.getTime(), timeZone);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/**
 * Instant UTC correspondant à « date locale + minutes depuis minuit » dans le fuseau.
 * Renvoie null si cette heure locale n'existe pas (passage à l'heure d'été).
 */
export function localMinuteToInstant(date: string, minute: number, timeZone: string): Date | null {
  const { y, m, d } = parseIsoDate(date);
  const t = new TZDate(y, m - 1, d, Math.floor(minute / 60), minute % 60, 0, timeZone);
  // Vérification aller-retour : l'heure locale obtenue doit être celle demandée.
  if (minute < 1440) {
    if (t.getDate() !== d || t.getHours() * 60 + t.getMinutes() !== minute) return null;
  }
  return new Date(t.getTime());
}

function overlaps(aStart: number, aEnd: number, intervals: Interval[]) {
  for (const i of intervals) {
    if (aStart < i.end.getTime() && i.start.getTime() < aEnd) return true;
  }
  return false;
}

export function computeAvailability(input: AvailabilityInput): DaySlots[] {
  const earliest = input.now.getTime() + input.minNoticeMinutes * MINUTE;
  const lastDate = addDays(localDateOf(input.now, input.timeZone), input.maxAdvanceDays);
  const step = Math.max(5, input.slotIntervalMinutes);
  const duration = input.durationMinutes * MINUTE;
  const blocked = (input.durationMinutes + input.bufferAfterMinutes) * MINUTE;
  const result: DaySlots[] = [];

  for (let date = input.fromDate; date <= input.toDate; date = addDays(date, 1)) {
    if (date > lastDate) {
      result.push({ date, slots: [] });
      continue;
    }
    const weekday = isoWeekday(date);
    const byInstant = new Map<number, string[]>();

    for (const member of input.staff) {
      const busy = member.busy.concat(input.closures);
      for (const range of member.week[weekday] ?? []) {
        const rangeEnd = localMinuteToInstant(date, range.endMinute, input.timeZone)?.getTime();
        if (rangeEnd === undefined) continue;
        // Créneaux alignés sur la grille de l'intervalle, à partir de minuit.
        const first = Math.ceil(range.startMinute / step) * step;
        for (
          let minute = first;
          minute + input.durationMinutes <= range.endMinute;
          minute += step
        ) {
          const instant = localMinuteToInstant(date, minute, input.timeZone);
          if (!instant) continue;
          const s = instant.getTime();
          if (s < earliest || s + duration > rangeEnd) continue;
          if (overlaps(s, s + blocked, busy)) continue;
          const list = byInstant.get(s);
          if (list) {
            if (!list.includes(member.id)) list.push(member.id);
          } else byInstant.set(s, [member.id]);
        }
      }
    }

    const slots = [...byInstant.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([s, staffIds]) => ({ start: new Date(s), staffIds }));
    result.push({ date, slots });
  }
  return result;
}

/** Le créneau demandé est-il disponible pour cet employé ? (re-vérification côté serveur) */
export function isSlotAvailable(input: AvailabilityInput, start: Date, staffId: string) {
  const date = localDateOf(start, input.timeZone);
  const [day] = computeAvailability({ ...input, fromDate: date, toDate: date });
  return day.slots.some(
    (s) => s.start.getTime() === start.getTime() && s.staffIds.includes(staffId),
  );
}

/** Choix de l'employé quand le client n'a pas de préférence : le moins occupé ce jour-là. */
export function pickStaff(
  candidates: string[],
  busyByStaff: Record<string, Interval[]>,
  date: string,
  timeZone: string,
) {
  const load = (id: string) =>
    (busyByStaff[id] ?? [])
      .filter((i) => localDateOf(i.start, timeZone) === date)
      .reduce((sum, i) => sum + (i.end.getTime() - i.start.getTime()), 0);
  return [...candidates].sort((a, b) => load(a) - load(b))[0];
}
