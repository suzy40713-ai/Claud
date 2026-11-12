import { describe, expect, it } from "vitest";
import { dailySummaryEmail } from "@/server/email/summary-template";

const base = {
  organizationName: "Salon <Léa>",
  dateLabel: "Jeudi 13 novembre",
  appointments: [
    { time: "09:00", customer: "Tom Roy", service: "Coupe", staff: "Léa" },
    { time: "10:30", customer: "Ana Silva", service: "Brushing", staff: "Léa" },
  ],
  freeSlots: { serviceName: "Coupe", count: 8, times: ["11:00", "11:30"] },
  cancellations: [{ customer: "Paul Martin", service: "Barbe", when: "prévu le ven. 14 nov." }],
  waitlist: { active: 2, pendingOffers: 1 },
  autopilot: { emailsSent: 5, offers: 1, waitlistBookings: 1, errors: 0 },
  dashboardUrl: "https://booksync.test/tableau-de-bord/calendrier",
};

describe("email du résumé quotidien", () => {
  it("reprend les vraies données, en HTML échappé et en texte", () => {
    const e = dailySummaryEmail(base);
    expect(e.template).toBe("daily_summary");
    expect(e.subject).toBe("Demain : 2 rendez-vous — Salon <Léa>");
    expect(e.html).toContain("Salon &lt;Léa&gt;");
    expect(e.html).not.toContain("Salon <Léa>");
    expect(e.text).toContain("- 09:00 · Tom Roy — Coupe (Léa)");
    expect(e.text).toContain("8 créneaux encore disponibles pour « Coupe » (11:00, 11:30…).");
    expect(e.text).toContain(
      "2 clients sur la liste d'attente, 1 proposition en attente de réponse.",
    );
    expect(e.text).toContain("5 emails envoyés automatiquement");
    expect(e.text).not.toMatch(/<(strong|span|p|table)|&#39;|&lt;/);
  });

  it("journée vide : messages explicites, sans erreur", () => {
    const e = dailySummaryEmail({
      ...base,
      appointments: [],
      freeSlots: null,
      cancellations: [],
      waitlist: { active: 0, pendingOffers: 0 },
      autopilot: { emailsSent: 0, offers: 0, waitlistBookings: 0, errors: 2 },
    });
    expect(e.subject).toBe("Demain : 0 rendez-vous — Salon <Léa>");
    expect(e.text).toContain("Aucun rendez-vous prévu pour le moment.");
    expect(e.text).toContain("Aucune demande en attente.");
    expect(e.text).toContain("2 erreurs à vérifier");
  });
});
