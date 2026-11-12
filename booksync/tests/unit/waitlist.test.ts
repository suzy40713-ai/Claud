import { describe, expect, it } from "vitest";
import {
  describePreferences,
  isCompatible,
  matchWaitlist,
  offerExpiry,
  type WaitlistCandidate,
} from "@/domain/waitlist/match";

const base: WaitlistCandidate = {
  id: "a",
  createdAt: new Date("2026-11-01T10:00:00Z"),
  serviceId: "coupe",
  staffId: null,
  dateFrom: "2026-11-10",
  dateTo: "2026-11-20",
  weekdays: [],
  fromMinute: 0,
  toMinute: 1440,
};
const slot = { staffId: "s1", date: "2026-11-12", weekday: 4, minute: 14 * 60, freeMinutes: 60 };
const services = { coupe: { blockMinutes: 30, staffIds: ["s1"] } };

describe("liste d'attente : compatibilité", () => {
  it("accepte un créneau dans la période, le bon jour et la bonne plage", () => {
    expect(isCompatible(base, slot, services)).toBe(true);
    expect(isCompatible({ ...base, weekdays: [4] }, slot, services)).toBe(true);
    expect(isCompatible({ ...base, fromMinute: 720, toMinute: 1020 }, slot, services)).toBe(true);
  });

  it("refuse hors période, autre jour, autre plage, autre employé ou durée insuffisante", () => {
    expect(isCompatible({ ...base, dateTo: "2026-11-11" }, slot, services)).toBe(false);
    expect(isCompatible({ ...base, weekdays: [1, 2] }, slot, services)).toBe(false);
    expect(isCompatible({ ...base, fromMinute: 0, toMinute: 720 }, slot, services)).toBe(false);
    expect(isCompatible({ ...base, staffId: "s2" }, slot, services)).toBe(false);
    expect(isCompatible(base, { ...slot, freeMinutes: 20 }, services)).toBe(false);
    expect(isCompatible({ ...base, serviceId: "autre" }, slot, services)).toBe(false);
    expect(isCompatible(base, slot, { coupe: { blockMinutes: 30, staffIds: ["s2"] } })).toBe(false);
  });

  it("premier inscrit, premier servi ; limite et exclusions respectées", () => {
    const entries = ["d", "b", "c", "a"].map((id, i) => ({
      ...base,
      id,
      createdAt: new Date(Date.UTC(2026, 10, 1, 10, 4 - i)),
    }));
    expect(matchWaitlist(entries, slot, services).map((e) => e.id)).toEqual(["a", "c", "b"]);
    expect(
      matchWaitlist(entries, slot, services, { exclude: new Set(["a"]), limit: 2 }).map(
        (e) => e.id,
      ),
    ).toEqual(["c", "b"]);
  });
});

describe("liste d'attente : expiration", () => {
  const now = new Date("2026-11-12T08:00:00Z");
  it("2 h maximum, au plus tard 1 h avant le rendez-vous", () => {
    expect(offerExpiry(now, new Date("2026-11-12T16:00:00Z"))).toEqual(
      new Date("2026-11-12T10:00:00Z"),
    );
    expect(offerExpiry(now, new Date("2026-11-12T10:00:00Z"))).toEqual(
      new Date("2026-11-12T09:00:00Z"),
    );
  });
  it("aucune proposition si le rendez-vous est trop proche", () => {
    expect(offerExpiry(now, new Date("2026-11-12T09:10:00Z"))).toBeNull();
  });
});

it("description lisible des préférences", () => {
  expect(describePreferences({ weekdays: [], fromMinute: 0, toMinute: 1440 })).toBe(
    "Tous les jours · Indifférent",
  );
  expect(describePreferences({ weekdays: [6, 1], fromMinute: 0, toMinute: 720 })).toBe(
    "Lun, Sam · Matin (avant 12 h)",
  );
});
