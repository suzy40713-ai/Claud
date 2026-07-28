import type { Activity } from "@prisma/client";
import type { WeeklyVolumePoint } from "@sports-coach/shared";

function mondayOfWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

export function computeWeeklyVolume(activities: Activity[]): WeeklyVolumePoint[] {
  const buckets = new Map<string, WeeklyVolumePoint>();

  for (const activity of activities) {
    const weekStart = mondayOfWeek(activity.date);
    const bucket = buckets.get(weekStart) ?? {
      weekStart,
      totalDistance: 0,
      totalDuree: 0,
      sessionCount: 0,
    };
    bucket.totalDistance += activity.distance;
    bucket.totalDuree += activity.duree;
    bucket.sessionCount += 1;
    buckets.set(weekStart, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}
