import { describe, expect, it } from "vitest";
import {
  AUTOMATIONS,
  isAutomationActive,
  planIncludes,
  resolveAutomations,
} from "@/domain/autopilot/automations";

describe("automatisations Autopilot", () => {
  it("hiérarchie des forfaits", () => {
    expect(planIncludes("pro", "starter")).toBe(true);
    expect(planIncludes("starter", "starter")).toBe(true);
    expect(planIncludes("free", "starter")).toBe(false);
  });

  it("valeur par défaut, choix enregistré et forfait insuffisant", () => {
    expect(isAutomationActive("reminder_24h", "starter", {})).toBe(true);
    expect(isAutomationActive("reminder_24h", "starter", { reminder_24h: false })).toBe(false);
    // Un choix « activé » ne suffit pas sans le forfait.
    expect(isAutomationActive("reminder_24h", "free", { reminder_24h: true })).toBe(false);
    expect(isAutomationActive("staff_alerts", "free", {})).toBe(true);
  });

  it("les protections verrouillées restent actives quoi qu'il arrive", () => {
    const locked = AUTOMATIONS.filter((a) => a.locked).map((a) => a.key);
    expect(locked).toEqual(["calendar_sync", "conflict_protection"]);
    for (const key of locked) {
      expect(isAutomationActive(key, "free", { [key]: false })).toBe(true);
    }
  });

  it("état résolu pour l'affichage", () => {
    const free = resolveAutomations("free", { cancellation_notice: false });
    const notice = free.find((a) => a.key === "cancellation_notice")!;
    expect(notice).toMatchObject({ enabled: false, includedInPlan: false, active: false });
    expect(free.filter((a) => a.active).map((a) => a.key)).toEqual([
      "staff_alerts",
      "calendar_sync",
      "conflict_protection",
    ]);
  });
});
