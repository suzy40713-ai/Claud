import "server-only";
import { and, asc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  appointment,
  autopilotAction,
  customer,
  dailySummary,
  member,
  notification,
  organization,
  service,
  staff,
  user,
  waitlistEntry,
  waitlistOffer,
} from "@/db/schema";
import { isAutomationActive } from "@/domain/autopilot/automations";
import { addDays, localDateOf, localMinuteToInstant } from "@/domain/availability/engine";
import { effectivePlan } from "@/domain/billing/plans";
import { env } from "@/lib/env";
import { capitalize, formatDateLong, formatInTz, formatTime } from "@/lib/format";
import { loadStoredRules } from "@/server/autopilot/rules";
import { getAvailability, staffForService, type OrgRow } from "@/server/booking/availability";
import { sendEmail } from "@/server/email/send";
import { dailySummaryEmail, type DailySummaryData } from "@/server/email/summary-template";

/** Heure locale d'envoi du résumé (rendez-vous du lendemain). */
export const SUMMARY_HOUR = 19;
const DAY = 86_400_000;

/** Données réelles du résumé : rendez-vous du lendemain, créneaux libres, annulations, attente, Autopilot. */
export async function buildDailySummary(org: OrgRow, now = new Date()): Promise<DailySummaryData> {
  const tz = org.timezone;
  const tomorrow = addDays(localDateOf(now, tz), 1);
  const start = localMinuteToInstant(tomorrow, 0, tz)!;
  const end = localMinuteToInstant(addDays(tomorrow, 1), 0, tz)!;
  const since = new Date(now.getTime() - DAY);

  const appts = await db
    .select({
      startsAt: appointment.startsAt,
      serviceName: appointment.serviceName,
      firstName: customer.firstName,
      lastName: customer.lastName,
      staffName: staff.displayName,
    })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .where(
      and(
        eq(appointment.organizationId, org.id),
        eq(appointment.status, "confirmed"),
        gte(appointment.startsAt, start),
        lt(appointment.startsAt, end),
      ),
    )
    .orderBy(asc(appointment.startsAt));

  // Créneaux libres : prestation réservable en ligne la plus courte (plus grand nombre de possibilités).
  const [shortest] = await db
    .select()
    .from(service)
    .where(
      and(
        eq(service.organizationId, org.id),
        eq(service.isActive, true),
        eq(service.isOnlineBookable, true),
        isNull(service.deletedAt),
      ),
    )
    .orderBy(asc(service.durationMinutes), asc(service.position))
    .limit(1);
  let freeSlots: DailySummaryData["freeSlots"] = null;
  if (shortest) {
    const staffIds = (await staffForService(db, org.id, shortest.id)).map((s) => s.id);
    const days = staffIds.length
      ? await getAvailability(org, shortest, staffIds, tomorrow, tomorrow)
      : [];
    const slots = days.flatMap((d) => d.slots);
    freeSlots = {
      serviceName: shortest.name,
      count: slots.length,
      times: slots.slice(0, 6).map((s) => formatTime(s.start, tz)),
    };
  }

  const cancelled = await db
    .select({
      startsAt: appointment.startsAt,
      serviceName: appointment.serviceName,
      firstName: customer.firstName,
      lastName: customer.lastName,
    })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .where(
      and(
        eq(appointment.organizationId, org.id),
        eq(appointment.status, "cancelled"),
        gte(appointment.cancelledAt, since),
      ),
    )
    .orderBy(asc(appointment.startsAt))
    .limit(20);

  const [wl] = await db
    .select({
      active: sql<number>`count(*) filter (where ${waitlistEntry.status} = 'active')`.mapWith(
        Number,
      ),
    })
    .from(waitlistEntry)
    .where(eq(waitlistEntry.organizationId, org.id));
  const [offers] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(waitlistOffer)
    .where(and(eq(waitlistOffer.organizationId, org.id), eq(waitlistOffer.status, "pending")));
  const [notif] = await db
    .select({
      sent: sql<number>`count(*) filter (where ${notification.status} = 'sent')`.mapWith(Number),
      failed: sql<number>`count(*) filter (where ${notification.status} = 'failed')`.mapWith(
        Number,
      ),
    })
    .from(notification)
    .where(and(eq(notification.organizationId, org.id), gte(notification.updatedAt, since)));
  const [acts] = await db
    .select({
      offers:
        sql<number>`count(*) filter (where ${autopilotAction.kind} = 'waitlist.offered')`.mapWith(
          Number,
        ),
      booked:
        sql<number>`count(*) filter (where ${autopilotAction.kind} = 'waitlist.booked')`.mapWith(
          Number,
        ),
      failed: sql<number>`count(*) filter (where ${autopilotAction.status} = 'failed')`.mapWith(
        Number,
      ),
    })
    .from(autopilotAction)
    .where(and(eq(autopilotAction.organizationId, org.id), gte(autopilotAction.createdAt, since)));

  return {
    organizationName: org.name,
    dateLabel: capitalize(formatDateLong(start, tz)),
    appointments: appts.map((a) => ({
      time: formatTime(a.startsAt, tz),
      customer: `${a.firstName} ${a.lastName}`,
      service: a.serviceName,
      staff: a.staffName,
    })),
    freeSlots,
    cancellations: cancelled.map((c) => ({
      customer: `${c.firstName} ${c.lastName}`,
      service: c.serviceName,
      when: `prévu le ${formatInTz(c.startsAt, tz, "EEE d MMM 'à' HH:mm")}`,
    })),
    waitlist: { active: wl?.active ?? 0, pendingOffers: offers?.n ?? 0 },
    autopilot: {
      emailsSent: notif?.sent ?? 0,
      offers: acts?.offers ?? 0,
      waitlistBookings: acts?.booked ?? 0,
      errors: (notif?.failed ?? 0) + (acts?.failed ?? 0),
    },
    dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/tableau-de-bord/calendrier`,
  };
}

/** Destinataires : propriétaire et administrateurs dont l'adresse est vérifiée. */
async function recipients(organizationId: string) {
  const rows = await db
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(
      and(
        eq(member.organizationId, organizationId),
        inArray(member.role, ["owner", "admin"]),
        eq(user.emailVerified, true),
      ),
    );
  return [...new Set(rows.map((r) => r.email.toLowerCase()))];
}

/**
 * Tâche planifiée : à partir de 19 h (heure locale), envoie une seule fois par jour le résumé
 * des entreprises Pro qui ont l'automatisation active. La ligne `daily_summary` est réservée
 * AVANT l'envoi (clé primaire entreprise + jour) : deux exécutions simultanées n'envoient jamais
 * deux résumés ; en cas d'échec, la réservation est libérée pour une nouvelle tentative.
 */
export async function sendDueDailySummaries(now = new Date()) {
  const stats = { sent: 0, failed: 0 };
  const orgs = await db.select().from(organization).where(eq(organization.plan, "pro"));
  for (const org of orgs) {
    const plan = effectivePlan(org.plan, org.subscriptionStatus);
    if (plan.id !== "pro") continue;
    const hour = Number(formatInTz(now, org.timezone, "H"));
    if (hour < SUMMARY_HOUR) continue;
    const rules = await loadStoredRules(db, org.id);
    if (!isAutomationActive("daily_summary", plan.id, rules)) continue;
    const forDate = addDays(localDateOf(now, org.timezone), 1);
    // Au plus 3 tentatives par jour en cas d'échec du fournisseur d'email.
    const [failures] = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(autopilotAction)
      .where(
        and(
          eq(autopilotAction.organizationId, org.id),
          eq(autopilotAction.kind, "daily_summary.failed"),
          sql`${autopilotAction.payload}->>'forDate' = ${forDate}`,
        ),
      );
    if (failures.n >= 3) continue;
    const [claimed] = await db
      .insert(dailySummary)
      .values({ organizationId: org.id, forDate })
      .onConflictDoNothing()
      .returning();
    if (!claimed) continue;
    try {
      const to = await recipients(org.id);
      const email = dailySummaryEmail(await buildDailySummary(org, now));
      let delivered = 0;
      for (const address of to) {
        const res = await sendEmail(address, email);
        if (res.status !== "failed") delivered++;
      }
      if (to.length && !delivered) throw new Error("Aucun email de résumé n'a pu être envoyé");
      await db
        .update(dailySummary)
        .set({ recipients: delivered })
        .where(and(eq(dailySummary.organizationId, org.id), eq(dailySummary.forDate, forDate)));
      await db.insert(autopilotAction).values({
        organizationId: org.id,
        source: "automation",
        kind: "daily_summary.sent",
        status: "done",
        summary: `Résumé quotidien envoyé à ${delivered} destinataire${delivered > 1 ? "s" : ""} (${email.subject.split(" — ")[0]})`,
        payload: { forDate, recipients: delivered },
        decidedAt: now,
      });
      stats.sent++;
    } catch (error) {
      console.error("[résumé quotidien]", org.id, error);
      await db
        .delete(dailySummary)
        .where(and(eq(dailySummary.organizationId, org.id), eq(dailySummary.forDate, forDate)));
      await db.insert(autopilotAction).values({
        organizationId: org.id,
        source: "automation",
        kind: "daily_summary.failed",
        status: "failed",
        summary: "Résumé quotidien non envoyé",
        error: String(error).slice(0, 300),
        payload: { forDate },
        decidedAt: now,
      });
      stats.failed++;
    }
  }
  return stats;
}
