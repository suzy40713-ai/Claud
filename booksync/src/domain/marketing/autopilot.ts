/** Autopilot marketing : calculs de progression (logique pure, testée). */

export const PLAN_DAYS = 30;

/** Nombre de jours entre deux dates locales AAAA-MM-JJ. */
export function daysBetween(from: string, to: string) {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** Jour du plan (1 à 30) ; au-delà, le plan est terminé (31). */
export function planDay(startDate: string, today: string) {
  return Math.min(PLAN_DAYS + 1, Math.max(1, daysBetween(startDate, today) + 1));
}

export type TaskLike = { day: number; doneAt: Date | null };

export function planProgress(tasks: TaskLike[], currentDay: number) {
  const done = tasks.filter((t) => t.doneAt).length;
  const late = tasks.filter((t) => t.day < currentDay && !t.doneAt).length;
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    late,
    finished: currentDay > PLAN_DAYS,
  };
}
