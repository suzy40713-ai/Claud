import { describe, expect, it } from "vitest";
import {
  addDays,
  computeAvailability,
  isoWeekday,
  isSlotAvailable,
  localDateOf,
  localMinuteToInstant,
  pickStaff,
  type AvailabilityInput,
} from "@/domain/availability/engine";
import { emptyWeek, validateWeek, type WeeklyHours } from "@/domain/schedule/hours";

const TZ = "Europe/Paris";
const h = (hh: number, mm = 0) => hh * 60 + mm;
const weekdays = (ranges: Array<[number, number]>): WeeklyHours => {
  const w = emptyWeek();
  for (let d = 1; d <= 7; d++) w[d] = ranges.map(([s, e]) => ({ startMinute: s, endMinute: e }));
  return w;
};
const at = (iso: string) => new Date(iso);
const times = (input: AvailabilityInput, date: string) =>
  computeAvailability({ ...input, fromDate: date, toDate: date })[0].slots.map((s) =>
    new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(
      s.start,
    ),
  );

function base(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    timeZone: TZ,
    fromDate: "2026-11-16",
    toDate: "2026-11-16",
    now: at("2026-11-10T08:00:00Z"),
    minNoticeMinutes: 0,
    maxAdvanceDays: 60,
    slotIntervalMinutes: 30,
    durationMinutes: 60,
    bufferAfterMinutes: 0,
    staff: [{ id: "a", week: weekdays([[h(9), h(12)]]), busy: [] }],
    closures: [],
    ...overrides,
  };
}

describe("utilitaires de dates", () => {
  it("jour ISO", () => {
    expect(isoWeekday("2026-11-16")).toBe(1); // lundi
    expect(isoWeekday("2026-11-22")).toBe(7); // dimanche
  });
  it("addDays traverse les mois et années", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("heure locale → UTC (hiver et été)", () => {
    expect(localMinuteToInstant("2026-11-16", h(9), TZ)?.toISOString()).toBe(
      "2026-11-16T08:00:00.000Z",
    );
    expect(localMinuteToInstant("2026-07-16", h(9), TZ)?.toISOString()).toBe(
      "2026-07-16T07:00:00.000Z",
    );
  });
  it("une heure inexistante (passage à l'heure d'été) renvoie null", () => {
    expect(localMinuteToInstant("2026-03-29", h(2, 30), TZ)).toBeNull();
  });
  it("date locale d'un instant (minuit UTC ≠ minuit Paris)", () => {
    expect(localDateOf(at("2026-11-15T23:30:00Z"), TZ)).toBe("2026-11-16");
  });
});

describe("calcul des créneaux", () => {
  it("créneaux alignés sur l'intervalle, le service tient dans la plage", () => {
    expect(times(base(), "2026-11-16")).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  it("les pauses (deux plages) ne sont jamais proposées", () => {
    const input = base({
      staff: [
        {
          id: "a",
          week: weekdays([
            [h(9), h(12)],
            [h(14), h(16)],
          ]),
          busy: [],
        },
      ],
    });
    const t = times(input, "2026-11-16");
    expect(t).toContain("11:00");
    expect(t).not.toContain("11:30");
    expect(t).not.toContain("12:00");
    expect(t).not.toContain("13:30");
    expect(t).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"]);
  });

  it("jour non travaillé : aucun créneau", () => {
    const week = emptyWeek();
    week[2] = [{ startMinute: h(9), endMinute: h(12) }];
    expect(times(base({ staff: [{ id: "a", week, busy: [] }] }), "2026-11-16")).toEqual([]);
  });

  it("un rendez-vous existant bloque les créneaux qui le chevauchent", () => {
    const busy = [{ start: at("2026-11-16T09:00:00Z"), end: at("2026-11-16T10:00:00Z") }]; // 10:00–11:00 Paris
    expect(
      times(base({ staff: [{ id: "a", week: weekdays([[h(9), h(12)]]), busy }] }), "2026-11-16"),
    ).toEqual(["09:00", "11:00"]);
  });

  it("le battement après la prestation est respecté", () => {
    const busy = [{ start: at("2026-11-16T10:00:00Z"), end: at("2026-11-16T10:30:00Z") }]; // 11:00–11:30
    const input = base({
      bufferAfterMinutes: 15,
      staff: [{ id: "a", week: weekdays([[h(9), h(13)]]), busy }],
    });
    const t = times(input, "2026-11-16");
    expect(t).toContain("09:30"); // 9:30–10:30 + 15 min = 10:45 < 11:00
    expect(t).not.toContain("10:00"); // 10:00–11:00 + 15 min chevauche 11:00
    expect(t).toContain("11:30");
  });

  it("une fermeture de l'entreprise bloque toute l'équipe", () => {
    const closures = [{ start: at("2026-11-15T23:00:00Z"), end: at("2026-11-16T23:00:00Z") }];
    const input = base({
      closures,
      staff: [
        { id: "a", week: weekdays([[h(9), h(12)]]), busy: [] },
        { id: "b", week: weekdays([[h(9), h(12)]]), busy: [] },
      ],
    });
    expect(times(input, "2026-11-16")).toEqual([]);
    expect(times(input, "2026-11-17").length).toBe(5);
  });

  it("délai minimum de réservation", () => {
    const input = base({ now: at("2026-11-16T07:40:00Z"), minNoticeMinutes: 120 }); // 08:40 Paris + 2 h = 10:40
    expect(times(input, "2026-11-16")).toEqual(["11:00"]);
  });

  it("jamais de créneau dans le passé", () => {
    const input = base({ now: at("2026-11-16T09:10:00Z") }); // 10:10 Paris
    expect(times(input, "2026-11-16")).toEqual(["10:30", "11:00"]);
  });

  it("horizon maximal de réservation", () => {
    const input = base({ now: at("2026-11-10T08:00:00Z"), maxAdvanceDays: 3 });
    expect(times(input, "2026-11-13").length).toBeGreaterThan(0);
    expect(times(input, "2026-11-14")).toEqual([]);
  });

  it("plusieurs employés : union des créneaux avec la liste des employés disponibles", () => {
    const input = base({
      staff: [
        { id: "a", week: weekdays([[h(9), h(11)]]), busy: [] },
        { id: "b", week: weekdays([[h(10), h(12)]]), busy: [] },
      ],
    });
    const [day] = computeAvailability(input);
    const byTime = Object.fromEntries(
      day.slots.map((s) => [
        new Intl.DateTimeFormat("fr-FR", {
          timeZone: TZ,
          hour: "2-digit",
          minute: "2-digit",
        }).format(s.start),
        s.staffIds,
      ]),
    );
    expect(byTime["09:00"]).toEqual(["a"]);
    expect(byTime["10:00"]).toEqual(["a", "b"]);
    expect(byTime["11:00"]).toEqual(["b"]);
  });

  it("intervalle de 15 minutes et plage commençant à une heure non alignée", () => {
    const input = base({
      slotIntervalMinutes: 15,
      durationMinutes: 30,
      staff: [{ id: "a", week: weekdays([[h(9, 10), h(10)]]), busy: [] }],
    });
    expect(times(input, "2026-11-16")).toEqual(["09:15", "09:30"]);
  });
});

describe("changements d'heure (Europe/Paris)", () => {
  it("passage à l'heure d'été (29 mars 2026) : la nuit 2 h–3 h n'existe pas", () => {
    const input = base({
      fromDate: "2026-03-29",
      toDate: "2026-03-29",
      now: at("2026-03-20T00:00:00Z"),
      durationMinutes: 30,
      staff: [{ id: "a", week: weekdays([[h(1), h(4)]]), busy: [] }],
    });
    const [day] = computeAvailability(input);
    const t = day.slots.map((s) =>
      new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(
        s.start,
      ),
    );
    expect(t).toEqual(["01:00", "01:30", "03:00", "03:30"]);
    // Les instants sont tous distincts et croissants.
    const ms = day.slots.map((s) => s.start.getTime());
    expect(new Set(ms).size).toBe(ms.length);
  });

  it("passage à l'heure d'hiver (25 octobre 2026) : pas de doublon d'instant", () => {
    const input = base({
      fromDate: "2026-10-25",
      toDate: "2026-10-25",
      now: at("2026-10-20T00:00:00Z"),
      durationMinutes: 30,
      staff: [{ id: "a", week: weekdays([[h(1), h(4)]]), busy: [] }],
    });
    const ms = computeAvailability(input)[0].slots.map((s) => s.start.getTime());
    expect(new Set(ms).size).toBe(ms.length);
    expect([...ms].sort((a, b) => a - b)).toEqual(ms);
  });

  it("un créneau d'été à 9 h est bien à 07:00 UTC", () => {
    const input = base({
      fromDate: "2026-07-06",
      toDate: "2026-07-06",
      now: at("2026-07-01T00:00:00Z"),
    });
    expect(computeAvailability(input)[0].slots[0].start.toISOString()).toBe(
      "2026-07-06T07:00:00.000Z",
    );
  });
});

describe("re-vérification d'un créneau et choix de l'employé", () => {
  it("isSlotAvailable accepte un créneau proposé et refuse un créneau pris ou hors grille", () => {
    const busy = [{ start: at("2026-11-16T09:00:00Z"), end: at("2026-11-16T10:00:00Z") }];
    const input = base({ staff: [{ id: "a", week: weekdays([[h(9), h(12)]]), busy }] });
    expect(isSlotAvailable(input, at("2026-11-16T08:00:00Z"), "a")).toBe(true);
    expect(isSlotAvailable(input, at("2026-11-16T09:00:00Z"), "a")).toBe(false);
    expect(isSlotAvailable(input, at("2026-11-16T08:10:00Z"), "a")).toBe(false);
    expect(isSlotAvailable(input, at("2026-11-16T08:00:00Z"), "b")).toBe(false);
  });

  it("sans préférence : l'employé le moins occupé ce jour-là", () => {
    const busy = {
      a: [{ start: at("2026-11-16T08:00:00Z"), end: at("2026-11-16T10:00:00Z") }],
      b: [{ start: at("2026-11-16T08:00:00Z"), end: at("2026-11-16T08:30:00Z") }],
    };
    expect(pickStaff(["a", "b"], busy, "2026-11-16", TZ)).toBe("b");
  });
});

describe("validation des horaires", () => {
  it("détecte les plages invalides ou qui se chevauchent", () => {
    const w = emptyWeek();
    w[1] = [{ startMinute: h(14), endMinute: h(12) }];
    expect(validateWeek(w)?.message).toMatch(/fin doit être après/);
    w[1] = [
      { startMinute: h(9), endMinute: h(12) },
      { startMinute: h(11), endMinute: h(14) },
    ];
    expect(validateWeek(w)?.message).toMatch(/chevauchent/);
    w[1] = [
      { startMinute: h(9), endMinute: h(12) },
      { startMinute: h(14), endMinute: h(18) },
    ];
    expect(validateWeek(w)).toBeNull();
  });
});
