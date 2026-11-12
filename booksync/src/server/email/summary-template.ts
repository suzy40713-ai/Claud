/**
 * Email du résumé quotidien (propriétaire et administrateurs). Fonction pure : testable sans base.
 */
import { btn, h1, p, shell } from "./booking-templates";
import { escapeHtml, type RenderedEmail } from "./templates";

export type DailySummaryData = {
  organizationName: string;
  /** « Jeudi 13 novembre » */
  dateLabel: string;
  appointments: Array<{ time: string; customer: string; service: string; staff: string }>;
  freeSlots: { serviceName: string; count: number; times: string[] } | null;
  cancellations: Array<{ customer: string; service: string; when: string }>;
  waitlist: { active: number; pendingOffers: number };
  autopilot: { emailsSent: number; offers: number; waitlistBookings: number; errors: number };
  dashboardUrl: string;
};

const section = (title: string, inner: string) =>
  `<h2 style="margin:22px 0 8px;font-size:15px;line-height:22px;">${escapeHtml(title)}</h2>${inner}`;
const muted = (t: string) =>
  `<p style="margin:0;font-size:14px;line-height:21px;color:#667085;">${escapeHtml(t)}</p>`;

function list(rows: string[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e7ec;border-radius:10px;">${rows
    .map(
      (r, i) =>
        `<tr><td style="padding:9px 12px;font-size:14px;line-height:20px;${i ? "border-top:1px solid #f2f4f7;" : ""}">${r}</td></tr>`,
    )
    .join("")}</table>`;
}

export function dailySummaryEmail(d: DailySummaryData): RenderedEmail {
  const n = d.appointments.length;
  const title = `Votre journée de demain : ${n} rendez-vous`;
  const appts = n
    ? list(
        d.appointments.map(
          (a) =>
            `<strong>${escapeHtml(a.time)}</strong> · ${escapeHtml(a.customer)} — ${escapeHtml(a.service)} <span style="color:#667085;">(${escapeHtml(a.staff)})</span>`,
        ),
      )
    : muted("Aucun rendez-vous prévu pour le moment.");
  const freeText = d.freeSlots
    ? d.freeSlots.count
      ? `${d.freeSlots.count} créneau${d.freeSlots.count > 1 ? "x" : ""} encore disponible${d.freeSlots.count > 1 ? "s" : ""} pour « ${d.freeSlots.serviceName} » (${d.freeSlots.times.join(", ")}${d.freeSlots.count > d.freeSlots.times.length ? "…" : ""}).`
      : `Journée complète pour « ${d.freeSlots.serviceName} ».`
    : "Aucune prestation réservable en ligne.";
  const cancels = d.cancellations.length
    ? list(
        d.cancellations.map(
          (c) =>
            `${escapeHtml(c.customer)} — ${escapeHtml(c.service)} <span style="color:#667085;">(${escapeHtml(c.when)})</span>`,
        ),
      )
    : muted("Aucune annulation ces dernières 24 heures.");
  const waitingText =
    d.waitlist.active || d.waitlist.pendingOffers
      ? `${d.waitlist.active} client${d.waitlist.active > 1 ? "s" : ""} sur la liste d'attente, ${d.waitlist.pendingOffers} proposition${d.waitlist.pendingOffers > 1 ? "s" : ""} en attente de réponse.`
      : "Aucune demande en attente.";
  const a = d.autopilot;
  const autoText = `${a.emailsSent} email${a.emailsSent > 1 ? "s" : ""} envoyé${a.emailsSent > 1 ? "s" : ""} automatiquement, ${a.offers} créneau${a.offers > 1 ? "x" : ""} reproposé${a.offers > 1 ? "s" : ""}, ${a.waitlistBookings} rendez-vous obtenu${a.waitlistBookings > 1 ? "s" : ""} via la liste d'attente${a.errors ? `, ${a.errors} erreur${a.errors > 1 ? "s" : ""} à vérifier` : ""}.`;
  const body = [
    h1(escapeHtml(title)),
    p(`${escapeHtml(d.dateLabel)} · ${escapeHtml(d.organizationName)}`),
    section("Rendez-vous de demain", appts),
    section("Créneaux disponibles", muted(freeText)),
    section("Annulations récentes", cancels),
    section("Demandes en attente", muted(waitingText)),
    section("Autopilot (dernières 24 h)", muted(autoText)),
    `<p style="margin:24px 0 0;">${btn(d.dashboardUrl, "Ouvrir mon planning")}</p>`,
  ].join("");
  const text = [
    title,
    `${d.dateLabel} · ${d.organizationName}`,
    "",
    "RENDEZ-VOUS DE DEMAIN",
    ...(n
      ? d.appointments.map((x) => `- ${x.time} · ${x.customer} — ${x.service} (${x.staff})`)
      : ["Aucun rendez-vous prévu pour le moment."]),
    "",
    "CRÉNEAUX DISPONIBLES",
    freeText,
    "",
    "ANNULATIONS RÉCENTES",
    ...(d.cancellations.length
      ? d.cancellations.map((c) => `- ${c.customer} — ${c.service} (${c.when})`)
      : ["Aucune annulation ces dernières 24 heures."]),
    "",
    "DEMANDES EN ATTENTE",
    waitingText,
    "",
    "AUTOPILOT (DERNIÈRES 24 H)",
    autoText,
    "",
    `Ouvrir mon planning : ${d.dashboardUrl}`,
  ].join("\n");
  return {
    template: "daily_summary",
    subject: `Demain : ${n} rendez-vous — ${d.organizationName}`,
    html: shell(
      title,
      `${d.dateLabel} : ${n} rendez-vous`,
      body,
      "#3563E9",
      "Résumé quotidien BookSync Autopilot. Vous pouvez le désactiver dans Autopilot.",
    ),
    text,
  };
}
