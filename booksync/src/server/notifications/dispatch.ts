import "server-only";
import { after } from "next/server";
import { and, eq, inArray, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, customer, notification, organization, staff } from "@/db/schema";
import { effectivePlan } from "@/domain/billing/plans";
import { env } from "@/lib/env";
import { capitalize, formatCents, formatDateLong, formatDuration, formatTime } from "@/lib/format";
import { manageUrl } from "@/lib/manage-token";
import { customerEmail, staffEmail, type BookingEmailData } from "@/server/email/booking-templates";
import { sendEmail } from "@/server/email/send";

const MAX_ATTEMPTS = 5;

type Row = typeof notification.$inferSelect;

/** Réserve un lot de notifications dues (SKIP LOCKED : plusieurs exécutions parallèles ne traitent jamais la même). */
async function claimDue(limit: number): Promise<Row[]> {
  // Notifications restées « en cours » (processus interrompu) : remises en file après 10 minutes.
  await db
    .update(notification)
    .set({ status: "pending" })
    .where(and(eq(notification.status, "processing"), lt(notification.updatedAt, new Date(Date.now() - 10 * 60_000))));
  return db.transaction(async (tx) => {
    const due = await tx
      .select({ id: notification.id })
      .from(notification)
      .where(and(eq(notification.status, "pending"), lte(notification.scheduledFor, new Date()), eq(notification.channel, "email")))
      .orderBy(notification.scheduledFor)
      .limit(limit)
      .for("update", { skipLocked: true });
    if (!due.length) return [];
    return tx
      .update(notification)
      .set({ status: "processing", attempts: sql`${notification.attempts} + 1` })
      .where(inArray(notification.id, due.map((d) => d.id)))
      .returning();
  });
}

async function buildData(n: Row) {
  if (!n.appointmentId) return null;
  const [row] = await db
    .select({ appt: appointment, cust: customer, org: organization, staffName: staff.displayName })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .where(eq(appointment.id, n.appointmentId));
  if (!row) return null;
  const { appt, cust, org } = row;
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  const data: BookingEmailData = {
    organizationName: org.name,
    organizationAddress: [org.addressLine1, [org.postalCode, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null,
    organizationPhone: org.phone,
    customerFirstName: cust.firstName,
    customerName: `${cust.firstName} ${cust.lastName}`,
    serviceName: appt.serviceName,
    staffName: row.staffName,
    dateLabel: capitalize(formatDateLong(appt.startsAt, org.timezone)),
    timeLabel: formatTime(appt.startsAt, org.timezone),
    durationLabel: formatDuration(Math.round((appt.endsAt.getTime() - appt.startsAt.getTime()) / 60_000)),
    priceLabel: appt.priceCents ? formatCents(appt.priceCents) : null,
    manageUrl: manageUrl(env.NEXT_PUBLIC_APP_URL, appt.id),
    bookingUrl: `${env.NEXT_PUBLIC_APP_URL}/${org.slug}`,
    dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/tableau-de-bord/calendrier`,
    cancellationNoticeHours: org.cancellationNoticeHours,
    brandColor: plan.features.bookingPageCustomization ? org.brandColor : null,
  };
  return { data, appt, plan, cust };
}

async function processOne(n: Row): Promise<"sent" | "failed" | "skipped"> {
  const built = await buildData(n);
  const finish = (status: "sent" | "failed" | "skipped" | "pending", extra: Partial<Row> = {}) =>
    db.update(notification).set({ status, ...extra }).where(eq(notification.id, n.id));

  if (!built) {
    await finish("skipped", { lastError: "Rendez-vous introuvable" });
    return "skipped";
  }
  const { data, appt, plan, cust } = built;
  const isReminder = n.type === "reminder_24h" || n.type === "reminder_2h";
  // Garde-fous au moment de l'envoi : rendez-vous annulé/déplacé, forfait changé, client désinscrit.
  if (isReminder && (appt.status !== "confirmed" || appt.startsAt <= new Date() || !plan.features.automaticReminders)) {
    await finish("skipped", { lastError: "Rappel devenu sans objet" });
    return "skipped";
  }
  if (n.audience === "customer" && (!plan.features.emailNotifications || !cust.emailOptIn)) {
    await finish("skipped", { lastError: "Notifications email non incluses ou client désinscrit" });
    return "skipped";
  }

  const email =
    n.audience === "customer"
      ? customerEmail(n.type as Parameters<typeof customerEmail>[0], data)
      : staffEmail(n.type as Parameters<typeof staffEmail>[0], data);
  const result = await sendEmail(n.recipient, email);

  if (result.status === "failed") {
    if (n.attempts >= MAX_ATTEMPTS) {
      await finish("failed", { lastError: "Échec après plusieurs tentatives", emailMessageId: result.id });
      return "failed";
    }
    // Nouvelle tentative avec un délai croissant : 2, 4, 8, 16 minutes.
    await finish("pending", {
      scheduledFor: new Date(Date.now() + 2 ** n.attempts * 60_000),
      lastError: "Échec d'envoi, nouvelle tentative programmée",
      emailMessageId: result.id,
    });
    return "failed";
  }
  await finish("sent", { sentAt: new Date(), emailMessageId: result.id, lastError: result.status === "logged" ? "Aucun fournisseur d'email configuré : email journalisé, non envoyé" : null });
  return "sent";
}

/** Traite les notifications dues. Appelé par le planificateur (/api/cron/notifications) et après chaque réservation. */
export async function processDueNotifications(limit = 50) {
  const stats = { sent: 0, failed: 0, skipped: 0 };
  for (let round = 0; round < 10; round++) {
    const batch = await claimDue(limit);
    if (!batch.length) break;
    for (const n of batch) {
      try {
        stats[await processOne(n)]++;
      } catch (error) {
        console.error("[notifications] erreur de traitement", n.id, error);
        await db
          .update(notification)
          .set({ status: n.attempts >= MAX_ATTEMPTS ? "failed" : "pending", scheduledFor: new Date(Date.now() + 5 * 60_000), lastError: String(error).slice(0, 500) })
          .where(eq(notification.id, n.id));
        stats.failed++;
      }
    }
  }
  return stats;
}

/** Envoi immédiat après la réponse HTTP (confirmation instantanée), sans ralentir l'utilisateur. */
export function dispatchSoon() {
  try {
    after(() => processDueNotifications(20).catch((e) => console.error("[notifications]", e)));
  } catch {
    // Hors requête (tests, scripts) : le planificateur prendra le relais.
  }
}
