/**
 * Emails liés aux rendez-vous (clients et équipe). Fonctions pures : testables sans base.
 */
import { escapeHtml, type RenderedEmail } from "./templates";

export type BookingEmailData = {
  organizationName: string;
  organizationAddress: string | null;
  organizationPhone: string | null;
  customerFirstName: string;
  customerName: string;
  serviceName: string;
  staffName: string;
  /** Date et heure déjà formatées dans le fuseau de l'entreprise. */
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  priceLabel: string | null;
  manageUrl: string;
  bookingUrl: string;
  dashboardUrl: string;
  cancellationNoticeHours: number;
  brandColor?: string | null;
};

function shell(title: string, preheader: string, body: string, color = "#3563E9") {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101828;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="background:#ffffff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;">
<div style="height:4px;background:${escapeHtml(color)};"></div>
<div style="padding:28px 26px;">${body}</div></td></tr>
<tr><td style="padding:18px 6px;font-size:12px;line-height:18px;color:#667085;">Email envoyé via BookSync pour le compte de l'établissement indiqué ci-dessus. Le paiement s'effectue directement sur place.</td></tr>
</table></td></tr></table></body></html>`;
}

function detailsTable(d: BookingEmailData) {
  const rows: Array<[string, string]> = [
    ["Prestation", d.serviceName],
    ["Date", d.dateLabel],
    ["Heure", `${d.timeLabel} (${d.durationLabel})`],
    ["Avec", d.staffName],
  ];
  if (d.priceLabel) rows.push(["Prix", `${d.priceLabel} — à régler sur place`]);
  if (d.organizationAddress) rows.push(["Adresse", d.organizationAddress]);
  if (d.organizationPhone) rows.push(["Téléphone", d.organizationPhone]);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e4e7ec;border-radius:10px;">${rows
    .map(
      ([k, v], i) =>
        `<tr><td style="padding:10px 14px;font-size:13px;color:#667085;width:110px;${i ? "border-top:1px solid #f2f4f7;" : ""}">${k}</td><td style="padding:10px 14px;font-size:14px;font-weight:600;${i ? "border-top:1px solid #f2f4f7;" : ""}">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

function btn(url: string, label: string, color = "#3563E9") {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background:${escapeHtml(color)};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:9px;">${escapeHtml(label)}</a>`;
}

function textDetails(d: BookingEmailData) {
  return [
    `Prestation : ${d.serviceName}`,
    `Date : ${d.dateLabel}`,
    `Heure : ${d.timeLabel} (${d.durationLabel})`,
    `Avec : ${d.staffName}`,
    d.priceLabel ? `Prix : ${d.priceLabel} — à régler sur place` : null,
    d.organizationAddress ? `Adresse : ${d.organizationAddress}` : null,
    d.organizationPhone ? `Téléphone : ${d.organizationPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function manageNote(d: BookingEmailData) {
  return d.cancellationNoticeHours > 0
    ? `Vous pouvez modifier ou annuler votre rendez-vous jusqu'à ${d.cancellationNoticeHours} h avant.`
    : "Vous pouvez modifier ou annuler votre rendez-vous jusqu'à son début.";
}

const h1 = (t: string) => `<h1 style="margin:0 0 6px;font-size:21px;line-height:28px;">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#475467;">${t}</p>`;

export function customerEmail(type: "booking_confirmation" | "booking_rescheduled" | "booking_cancelled" | "reminder_24h" | "reminder_2h", d: BookingEmailData): RenderedEmail {
  const org = escapeHtml(d.organizationName);
  const color = d.brandColor ?? "#3563E9";
  const copy = {
    booking_confirmation: {
      subject: `Rendez-vous confirmé — ${d.organizationName}, ${d.dateLabel} à ${d.timeLabel}`,
      title: "Votre rendez-vous est confirmé",
      intro: `Bonjour ${escapeHtml(d.customerFirstName)}, merci pour votre réservation chez <strong>${org}</strong>.`,
    },
    booking_rescheduled: {
      subject: `Rendez-vous modifié — ${d.organizationName}, ${d.dateLabel} à ${d.timeLabel}`,
      title: "Votre rendez-vous a été modifié",
      intro: `Bonjour ${escapeHtml(d.customerFirstName)}, voici le nouvel horaire de votre rendez-vous chez <strong>${org}</strong>.`,
    },
    booking_cancelled: {
      subject: `Rendez-vous annulé — ${d.organizationName}`,
      title: "Votre rendez-vous est annulé",
      intro: `Bonjour ${escapeHtml(d.customerFirstName)}, le rendez-vous suivant chez <strong>${org}</strong> a été annulé.`,
    },
    reminder_24h: {
      subject: `Rappel : rendez-vous demain à ${d.timeLabel} — ${d.organizationName}`,
      title: "À demain !",
      intro: `Bonjour ${escapeHtml(d.customerFirstName)}, nous vous rappelons votre rendez-vous chez <strong>${org}</strong>.`,
    },
    reminder_2h: {
      subject: `Rappel : rendez-vous aujourd'hui à ${d.timeLabel} — ${d.organizationName}`,
      title: "C'est bientôt !",
      intro: `Bonjour ${escapeHtml(d.customerFirstName)}, votre rendez-vous chez <strong>${org}</strong> a lieu dans environ 2 heures.`,
    },
  }[type];
  const cancelled = type === "booking_cancelled";
  const body = [
    h1(copy.title),
    p(copy.intro),
    detailsTable(d),
    cancelled
      ? p(`Vous pouvez reprendre rendez-vous à tout moment.`) + `<p style="margin:20px 0 4px;">${btn(d.bookingUrl, "Reprendre rendez-vous", color)}</p>`
      : `<p style="margin:20px 0 10px;">${btn(d.manageUrl, "Gérer mon rendez-vous", color)}</p>` +
        `<p style="margin:0;font-size:13px;color:#667085;">${escapeHtml(manageNote(d))}</p>`,
  ].join("");
  const text = `${copy.title}

${copy.intro.replace(/<[^>]+>/g, "")}

${textDetails(d)}

${cancelled ? `Reprendre rendez-vous : ${d.bookingUrl}` : `Gérer mon rendez-vous : ${d.manageUrl}\n${manageNote(d)}`}`;
  return { template: type, subject: copy.subject, html: shell(copy.title, `${d.dateLabel} à ${d.timeLabel}`, body, color), text };
}

export function staffEmail(type: "staff_new_booking" | "staff_booking_cancelled" | "staff_booking_rescheduled", d: BookingEmailData): RenderedEmail {
  const copy = {
    staff_new_booking: { subject: `Nouvelle réservation : ${d.customerName}, ${d.dateLabel} à ${d.timeLabel}`, title: "Nouvelle réservation" },
    staff_booking_rescheduled: { subject: `Rendez-vous déplacé : ${d.customerName}, ${d.dateLabel} à ${d.timeLabel}`, title: "Rendez-vous déplacé" },
    staff_booking_cancelled: { subject: `Annulation : ${d.customerName}, ${d.dateLabel} à ${d.timeLabel}`, title: "Rendez-vous annulé" },
  }[type];
  const body = [h1(copy.title), p(`Client : <strong>${escapeHtml(d.customerName)}</strong>`), detailsTable({ ...d, organizationAddress: null, organizationPhone: null }), `<p style="margin:20px 0 0;">${btn(d.dashboardUrl, "Ouvrir le calendrier")}</p>`].join("");
  const text = `${copy.title}\n\nClient : ${d.customerName}\n${textDetails({ ...d, organizationAddress: null, organizationPhone: null })}\n\nCalendrier : ${d.dashboardUrl}`;
  return { template: type, subject: copy.subject, html: shell(copy.title, copy.subject, body), text };
}
