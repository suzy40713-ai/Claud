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
  /** Lien de visio (rendez-vous en ligne), si l'établissement en a un. */
  meetingUrl?: string | null;
  /** Ex. « acompte de 5,00 € payé en ligne, reste 20,00 € à régler sur place » */
  depositLabel?: string | null;
  manageUrl: string;
  bookingUrl: string;
  dashboardUrl: string;
  cancellationNoticeHours: number;
  brandColor?: string | null;
};

export function shell(
  title: string,
  preheader: string,
  body: string,
  color = "#3563E9",
  footer = "Email envoyé via BookSync pour le compte de l'établissement indiqué ci-dessus. Le paiement s'effectue directement sur place.",
) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101828;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="background:#ffffff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;">
<div style="height:4px;background:${escapeHtml(color)};"></div>
<div style="padding:28px 26px;">${body}</div></td></tr>
<tr><td style="padding:18px 6px;font-size:12px;line-height:18px;color:#667085;">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`;
}

function detailsTable(d: BookingEmailData) {
  const rows: Array<[string, string]> = [
    ["Prestation", d.serviceName],
    ["Date", d.dateLabel],
    ["Heure", `${d.timeLabel} (${d.durationLabel})`],
    ["Avec", d.staffName],
  ];
  if (d.priceLabel)
    rows.push([
      "Prix",
      `${d.priceLabel} — ${d.depositLabel ?? (d.meetingUrl ? "à régler directement" : "à régler sur place")}`,
    ]);
  if (d.meetingUrl) rows.push(["Visio", d.meetingUrl]);
  else if (d.organizationAddress) rows.push(["Adresse", d.organizationAddress]);
  if (d.organizationPhone) rows.push(["Téléphone", d.organizationPhone]);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e4e7ec;border-radius:10px;">${rows
    .map(
      ([k, v], i) =>
        `<tr><td style="padding:10px 14px;font-size:13px;color:#667085;width:110px;${i ? "border-top:1px solid #f2f4f7;" : ""}">${k}</td><td style="padding:10px 14px;font-size:14px;font-weight:600;${i ? "border-top:1px solid #f2f4f7;" : ""}">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

export function btn(url: string, label: string, color = "#3563E9") {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background:${escapeHtml(color)};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:9px;">${escapeHtml(label)}</a>`;
}

function textDetails(d: BookingEmailData) {
  return [
    `Prestation : ${d.serviceName}`,
    `Date : ${d.dateLabel}`,
    `Heure : ${d.timeLabel} (${d.durationLabel})`,
    `Avec : ${d.staffName}`,
    d.priceLabel
      ? `Prix : ${d.priceLabel} — ${d.depositLabel ?? (d.meetingUrl ? "à régler directement" : "à régler sur place")}`
      : null,
    d.meetingUrl
      ? `Visio : ${d.meetingUrl}`
      : d.organizationAddress
        ? `Adresse : ${d.organizationAddress}`
        : null,
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

export const h1 = (t: string) =>
  `<h1 style="margin:0 0 6px;font-size:21px;line-height:28px;">${t}</h1>`;
export const p = (t: string) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#475467;">${t}</p>`;

export function customerEmail(
  type:
    | "booking_confirmation"
    | "booking_rescheduled"
    | "booking_cancelled"
    | "reminder_24h"
    | "reminder_2h",
  d: BookingEmailData,
): RenderedEmail {
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
      ? p(`Vous pouvez reprendre rendez-vous à tout moment.`) +
        `<p style="margin:20px 0 4px;">${btn(d.bookingUrl, "Reprendre rendez-vous", color)}</p>`
      : `<p style="margin:20px 0 10px;">${btn(d.manageUrl, "Gérer mon rendez-vous", color)}</p>` +
        `<p style="margin:0;font-size:13px;color:#667085;">${escapeHtml(manageNote(d))}</p>`,
  ].join("");
  const text = `${copy.title}

${copy.intro.replace(/<[^>]+>/g, "")}

${textDetails(d)}

${cancelled ? `Reprendre rendez-vous : ${d.bookingUrl}` : `Gérer mon rendez-vous : ${d.manageUrl}\n${manageNote(d)}`}`;
  return {
    template: type,
    subject: copy.subject,
    html: shell(copy.title, `${d.dateLabel} à ${d.timeLabel}`, body, color),
    text,
  };
}

export function staffEmail(
  type: "staff_new_booking" | "staff_booking_cancelled" | "staff_booking_rescheduled",
  d: BookingEmailData,
): RenderedEmail {
  const copy = {
    staff_new_booking: {
      subject: `Nouvelle réservation : ${d.customerName}, ${d.dateLabel} à ${d.timeLabel}`,
      title: "Nouvelle réservation",
    },
    staff_booking_rescheduled: {
      subject: `Rendez-vous déplacé : ${d.customerName}, ${d.dateLabel} à ${d.timeLabel}`,
      title: "Rendez-vous déplacé",
    },
    staff_booking_cancelled: {
      subject: `Annulation : ${d.customerName}, ${d.dateLabel} à ${d.timeLabel}`,
      title: "Rendez-vous annulé",
    },
  }[type];
  const body = [
    h1(copy.title),
    p(`Client : <strong>${escapeHtml(d.customerName)}</strong>`),
    detailsTable({ ...d, organizationAddress: null, organizationPhone: null }),
    `<p style="margin:20px 0 0;">${btn(d.dashboardUrl, "Ouvrir le calendrier")}</p>`,
  ].join("");
  const text = `${copy.title}\n\nClient : ${d.customerName}\n${textDetails({ ...d, organizationAddress: null, organizationPhone: null })}\n\nCalendrier : ${d.dashboardUrl}`;
  return {
    template: type,
    subject: copy.subject,
    html: shell(copy.title, copy.subject, body),
    text,
  };
}

export type WaitlistOfferEmailData = {
  organizationName: string;
  organizationAddress: string | null;
  customerFirstName: string;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  priceLabel: string | null;
  acceptUrl: string;
  /** Échéance déjà formatée, ex. « aujourd'hui à 16:30 » */
  expiresLabel: string;
  brandColor?: string | null;
};

/** Proposition d'un créneau libéré à un client inscrit sur la liste d'attente. */
export function waitlistOfferEmail(d: WaitlistOfferEmailData): RenderedEmail {
  const color = d.brandColor ?? "#3563E9";
  const org = escapeHtml(d.organizationName);
  const title = "Un créneau s'est libéré pour vous";
  const intro = `Bonjour ${escapeHtml(d.customerFirstName)}, vous êtes sur la liste d'attente de <strong>${org}</strong> et un créneau correspondant à vos préférences vient de se libérer.`;
  const rows: Array<[string, string]> = [
    ["Prestation", d.serviceName],
    ["Date", d.dateLabel],
    ["Heure", `${d.timeLabel} (${d.durationLabel})`],
    ["Avec", d.staffName],
  ];
  if (d.priceLabel) rows.push(["Prix", `${d.priceLabel} — à régler sur place`]);
  if (d.organizationAddress) rows.push(["Adresse", d.organizationAddress]);
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e4e7ec;border-radius:10px;">${rows
    .map(
      ([k, v], i) =>
        `<tr><td style="padding:10px 14px;font-size:13px;color:#667085;width:110px;${i ? "border-top:1px solid #f2f4f7;" : ""}">${k}</td><td style="padding:10px 14px;font-size:14px;font-weight:600;${i ? "border-top:1px solid #f2f4f7;" : ""}">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;
  const notice = `Ce créneau est aussi proposé à d'autres personnes : la première qui confirme l'obtient. Proposition valable jusqu'à ${d.expiresLabel}.`;
  const body = [
    h1(title),
    p(intro),
    table,
    `<p style="margin:20px 0 10px;">${btn(d.acceptUrl, "Réserver ce créneau", color)}</p>`,
    `<p style="margin:0;font-size:13px;color:#667085;">${escapeHtml(notice)}</p>`,
  ].join("");
  const text = `${title}

${intro.replace(/<[^>]+>/g, "")}

${rows.map(([k, v]) => `${k} : ${v}`).join("\n")}

Réserver ce créneau : ${d.acceptUrl}
${notice}`;
  return {
    template: "waitlist_offer",
    subject: `Créneau disponible : ${d.dateLabel} à ${d.timeLabel} — ${d.organizationName}`,
    html: shell(title, `${d.dateLabel} à ${d.timeLabel}`, body, color),
    text,
  };
}

/** Demande d'avis envoyée quelques heures après le rendez-vous. */
export function reviewRequestEmail(d: BookingEmailData & { reviewUrl: string }): RenderedEmail {
  const color = d.brandColor ?? "#3563E9";
  const org = escapeHtml(d.organizationName);
  const title = "Comment s'est passé votre rendez-vous ?";
  const intro = `Bonjour ${escapeHtml(d.customerFirstName)}, merci d'être venu(e) chez <strong>${org}</strong> pour votre ${escapeHtml(d.serviceName.toLowerCase())} du ${escapeHtml(d.dateLabel)}.`;
  const ask =
    "Votre avis aide l'établissement à s'améliorer et les autres clients à choisir. Cela prend 30 secondes.";
  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<a href="${escapeHtml(`${d.reviewUrl}?note=${n}`)}" style="display:inline-block;margin:0 3px;font-size:30px;line-height:36px;color:#f5a524;text-decoration:none;" aria-label="${n} sur 5">★</a>`,
    )
    .join("");
  const body = [
    h1(title),
    p(intro),
    p(escapeHtml(ask)),
    `<p style="margin:18px 0 6px;text-align:center;">${stars}</p>`,
    `<p style="margin:0 0 18px;text-align:center;font-size:12px;color:#667085;">Touchez une étoile pour noter</p>`,
    `<p style="margin:0;text-align:center;">${btn(d.reviewUrl, "Donner mon avis", color)}</p>`,
  ].join("");
  const text = `${title}

${intro.replace(/<[^>]+>/g, "")}

${ask}

Donner mon avis : ${d.reviewUrl}`;
  return {
    template: "review_request",
    subject: `Votre avis sur ${d.organizationName} ?`,
    html: shell(
      title,
      ask,
      body,
      color,
      "Email envoyé via BookSync pour le compte de l'établissement indiqué ci-dessus. Seuls les clients ayant eu un rendez-vous peuvent déposer un avis.",
    ),
    text,
  };
}

export type GiftCardEmailData = {
  organizationName: string;
  buyerFirstName: string;
  recipientName: string;
  amountLabel: string;
  code: string;
  expiresLabel: string;
  cardUrl: string;
  bookingUrl: string;
  brandColor?: string | null;
};

/** Email à l'acheteur : la carte cadeau est payée, avec le lien pour l'imprimer ou la transférer. */
export function giftCardEmail(d: GiftCardEmailData): RenderedEmail {
  const color = d.brandColor ?? "#3563E9";
  const org = escapeHtml(d.organizationName);
  const title = "Votre carte cadeau est prête 🎁";
  const intro = `Bonjour ${escapeHtml(d.buyerFirstName)}, merci pour votre achat ! Votre carte cadeau <strong>${escapeHtml(d.amountLabel)}</strong> chez <strong>${org}</strong> pour ${escapeHtml(d.recipientName)} est prête.`;
  const how =
    "Imprimez-la ou transférez le lien à la personne qui la reçoit. Elle présente le code au salon, et le montant est déduit de sa prestation.";
  const body = [
    h1(title),
    p(intro),
    `<p style="margin:18px 0;text-align:center;font-family:ui-monospace,Menlo,monospace;font-size:26px;letter-spacing:3px;font-weight:700;">${escapeHtml(d.code)}</p>`,
    p(escapeHtml(how)),
    p(`Valable jusqu'au ${escapeHtml(d.expiresLabel)}.`),
    `<p style="margin:18px 0 0;text-align:center;">${btn(d.cardUrl, "Voir et imprimer la carte", color)}</p>`,
  ].join("");
  const text = `${title}

${intro.replace(/<[^>]+>/g, "")}

Code : ${d.code}
Valable jusqu'au ${d.expiresLabel}.

${how}

Voir et imprimer la carte : ${d.cardUrl}
Réserver chez ${d.organizationName} : ${d.bookingUrl}`;
  return {
    template: "gift_card",
    subject: `Votre carte cadeau ${d.organizationName}`,
    html: shell(
      title,
      `Carte cadeau ${d.amountLabel} — code ${d.code}`,
      body,
      color,
      "Email envoyé via BookSync pour le compte de l'établissement indiqué ci-dessus. Le paiement a été encaissé directement par l'établissement.",
    ),
    text,
  };
}
