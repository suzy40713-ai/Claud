import { describe, expect, it } from "vitest";
import { analyzeBookings, type InsightAppointment } from "@/domain/insights/analyze";
import type { WeeklyHours } from "@/domain/schedule/hours";

const now = new Date("2026-11-12T12:00:00Z");
const DAY = 86_400_000;
const hours: WeeklyHours = {
  1: [{ startMinute: 540, endMinute: 1080 }],
  2: [{ startMinute: 540, endMinute: 1080 }],
  3: [{ startMinute: 540, endMinute: 1080 }],
  4: [{ startMinute: 540, endMinute: 1080 }],
  5: [{ startMinute: 540, endMinute: 1080 }],
  6: [{ startMinute: 540, endMinute: 1080 }],
  7: [],
};

let n = 0;
function appt(over: Partial<InsightAppointment> & { daysAgo: number }): InsightAppointment {
  const { daysAgo, ...rest } = over;
  n++;
  return {
    startsAt: new Date(now.getTime() - daysAgo * DAY),
    status: "completed",
    cancelledAt: null,
    serviceId: "coupe",
    serviceName: "Coupe",
    priceCents: 3000,
    customerId: `c${n}`,
    customerName: `Client ${n}`,
    weekday: 6,
    hour: 10,
    ...rest,
  };
}

const automations = { reminders: true, waitlist: true, waitlistAvailable: true };

describe("analyse de l'activité", () => {
  it("peu de données : aucune conclusion hâtive", () => {
    const r = analyzeBookings({
      appointments: [appt({ daysAgo: 3 }), appt({ daysAgo: 4 })],
      now,
      openingHours: hours,
      automations,
    });
    expect(r.enoughData).toBe(false);
    expect(r.recommendations.map((x) => x.id)).toEqual(["sample"]);
  });

  it("heures de pointe, périodes creuses, prestations, annulations, tendance", () => {
    const list: InsightAppointment[] = [];
    // Samedi 10 h très demandé, mardi 9 h–17 h régulier, lundi 14 h jamais réservé.
    for (let i = 0; i < 12; i++) list.push(appt({ daysAgo: 2 + i * 7, weekday: 6, hour: 10 }));
    for (let h = 9; h < 18; h++)
      for (let w = 0; w < 2; w++)
        if (h !== 14)
          list.push(
            appt({
              daysAgo: 5 + w * 7,
              weekday: 2,
              hour: h,
              serviceId: "barbe",
              serviceName: "Barbe",
            }),
          );
    for (const d of [1, 2, 3, 4, 5])
      for (let h = 9; h < 18; h++)
        if (!(d === 1 && h === 14)) list.push(appt({ daysAgo: 40 + d, weekday: d, hour: h }));
    // Annulations, dont deux tardives, et une absence.
    list.push(
      appt({ daysAgo: 10, status: "cancelled", cancelledAt: new Date(now.getTime() - 10.5 * DAY) }),
      appt({ daysAgo: 11, status: "cancelled", cancelledAt: new Date(now.getTime() - 11.2 * DAY) }),
      appt({ daysAgo: 12, status: "cancelled", cancelledAt: new Date(now.getTime() - 20 * DAY) }),
      appt({ daysAgo: 13, status: "no_show" }),
      ...Array.from({ length: 7 }, (_, i) =>
        appt({
          daysAgo: 20 + i,
          status: "cancelled",
          cancelledAt: new Date(now.getTime() - (25 + i) * DAY),
        }),
      ),
    );
    const r = analyzeBookings({
      appointments: list,
      now,
      openingHours: hours,
      automations: { ...automations, reminders: false, waitlist: false },
    });
    expect(r.enoughData).toBe(true);
    expect(r.peakSlots[0]).toMatchObject({ weekday: 6, hour: 10, count: 13 }); // 12 + l'absence du samedi;
    expect(r.quietSlots[0].count).toBe(0);
    expect(r.quietSlots.every((s) => s.weekday !== 7)).toBe(true); // dimanche fermé
    expect(r.services[0].name).toBe("Coupe");
    expect(r.cancellations).toMatchObject({ count: 10, late: 2, noShows: 1 });
    const ids = r.recommendations.map((x) => x.id);
    expect(ids).toContain("peak");
    expect(ids).toContain("reminders");
    expect(ids).toContain("waitlist");
    // Chaque recommandation cite des chiffres.
    for (const rec of r.recommendations) expect(rec.detail).toMatch(/\d/);
  });

  it("clients réguliers et clients à relancer", () => {
    const list = [
      // Habituée toutes les 3 semaines, absente depuis 80 jours, sans rendez-vous prévu.
      ...[80, 101, 122, 143].map((d) =>
        appt({ daysAgo: d, customerId: "lea", customerName: "Léa Martin" }),
      ),
      // Régulier toujours actif (rendez-vous à venir).
      ...[70, 91, 112].map((d) => appt({ daysAgo: d, customerId: "tom", customerName: "Tom Roy" })),
      appt({ daysAgo: -5, status: "confirmed", customerId: "tom", customerName: "Tom Roy" }),
    ];
    const r = analyzeBookings({ appointments: list, now, openingHours: hours, automations });
    expect(r.regulars.map((c) => c.name)).toEqual(["Léa Martin", "Tom Roy"]);
    expect(r.lapsed.map((c) => c.name)).toEqual(["Léa Martin"]);
    expect(r.lapsed[0]).toMatchObject({ avgIntervalDays: 21, daysSince: 80 });
    expect(r.recommendations.find((x) => x.id === "lapsed")?.detail).toContain("Léa Martin");
    expect(r.trend.upcoming14).toBe(1);
  });

  it("tendance sur 30 jours", () => {
    const list = [
      ...Array.from({ length: 6 }, (_, i) => appt({ daysAgo: 1 + i })),
      ...Array.from({ length: 12 }, (_, i) => appt({ daysAgo: 31 + i })),
    ];
    const r = analyzeBookings({ appointments: list, now, openingHours: hours, automations });
    expect(r.trend).toMatchObject({ last30: 6, prev30: 12, changePct: -50 });
    expect(r.recommendations.find((x) => x.id === "trend")?.tone).toBe("warning");
  });
});
