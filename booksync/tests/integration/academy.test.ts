import { afterAll, describe, expect, it } from "vitest";
import { sql as pg } from "@/db/client";
import { academyProgress, canReadLesson, setLessonDone } from "@/server/academy/progress";
import { addResult, monthResults } from "@/server/marketing/results";
import { makeOrg } from "./factory";

afterAll(() => pg.end());

describe("Académie et rentabilité", () => {
  it("progression par utilisateur, leçons verrouillées selon le forfait", async () => {
    const free = await makeOrg();
    expect(canReadLesson(free, "verite-argent")).toBe(true);
    expect(canReadLesson(free, "prix")).toBe(false);
    await setLessonDone(free, "verite-argent", true);
    await setLessonDone(free, "verite-argent", true); // idempotent
    await expect(setLessonDone(free, "prix", true)).rejects.toThrow(/forfait supérieur/);
    expect((await academyProgress(free)).count).toBe(1);
    await setLessonDone(free, "verite-argent", false);
    expect((await academyProgress(free)).count).toBe(0);
    const pro = await makeOrg({ plan: "pro" });
    expect(canReadLesson(pro, "premiere-pub")).toBe(true);
    expect((await academyProgress(pro)).count).toBe(0);
  });

  it("chiffre d'affaires du mois pour la jauge", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const now = new Date("2026-11-25T10:00:00Z");
    await addResult(ctx, { date: "2026-11-03", channel: "tiktok", sales: "1", revenue: "15" }, now);
    await addResult(ctx, { date: "2026-10-30", channel: "tiktok", sales: "1", revenue: "40" }, now);
    expect(await monthResults(ctx, now)).toEqual({ revenueCents: 1500, sales: 1 });
  });
});
