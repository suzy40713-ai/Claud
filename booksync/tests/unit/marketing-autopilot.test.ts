import { describe, expect, it } from "vitest";
import { daysBetween, planDay, planProgress } from "@/domain/marketing/autopilot";

describe("Autopilot marketing", () => {
  it("compte les jours, changements d'heure et années compris", () => {
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(planDay("2026-11-01", "2026-11-01")).toBe(1);
    expect(planDay("2026-11-01", "2026-11-30")).toBe(30);
    expect(planDay("2026-11-01", "2026-12-15")).toBe(31);
    expect(planDay("2026-11-05", "2026-11-01")).toBe(1);
  });
  it("calcule progression et retards", () => {
    const tasks = [
      { day: 1, doneAt: new Date() },
      { day: 1, doneAt: null },
      { day: 2, doneAt: null },
      { day: 3, doneAt: null },
    ];
    expect(planProgress(tasks, 3)).toEqual({ done: 1, total: 4, percent: 25, late: 2, finished: false });
    expect(planProgress([], 31).finished).toBe(true);
  });
});
