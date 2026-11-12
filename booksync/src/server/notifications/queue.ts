import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { member, notification, staff, user } from "@/db/schema";
import type { AutomationKey } from "@/domain/autopilot/automations";
import type { Plan } from "@/domain/billing/plans";
import { loadActiveChecker } from "@/server/autopilot/rules";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type BookingEvent = "created" | "rescheduled" | "cancelled";

export type NotifyContext = {
  organization: { id: string };
  plan: Plan;
  appointment: { id: string; staffId: string; startsAt: Date; status: string };
  customer: { email: string | null; emailOptIn: boolean };
  /** Qui est à l'origine de l'événement (pour ne pas notifier la personne qui vient d'agir). */
  actor: { kind: "customer" } | { kind: "staff"; email: string };
};

const REMINDERS = [
  { type: "reminder_24h" as const, hours: 24 },
  { type: "reminder_2h" as const, hours: 2 },
] satisfies Array<{ type: AutomationKey; hours: number }>;

/** Destinataires internes : l'employé concerné + propriétaires et administrateurs (adresses uniques). */
async function staffRecipients(tx: Tx, organizationId: string, staffId: string) {
  const assigned = await tx
    .select({ email: user.email })
    .from(staff)
    .innerJoin(member, eq(member.id, staff.memberId))
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(staff.id, staffId), eq(staff.organizationId, organizationId)));
  const managers = await tx
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(
      and(eq(member.organizationId, organizationId), inArray(member.role, ["owner", "admin"])),
    );
  return [...new Set([...assigned, ...managers].map((r) => r.email.toLowerCase()))];
}

/**
 * Programme les notifications d'un événement de réservation, DANS la transaction de la réservation :
 * si la réservation échoue, aucune notification n'existe ; si elle réussit, elles existent toutes.
 * `dedupe_key` (unique) empêche toute notification en double, même en cas de nouvelle tentative.
 */
export async function enqueueBookingNotifications(tx: Tx, event: BookingEvent, ctx: NotifyContext) {
  const { organization: org, plan, appointment: appt, customer } = ctx;
  const startsIso = appt.startsAt.toISOString();
  const rows: Array<typeof notification.$inferInsert> = [];
  // Règles Autopilot de l'entreprise (lues dans la transaction de la réservation).
  const active = await loadActiveChecker(tx, org.id, plan.id);

  // Un changement d'horaire ou une annulation rend caducs les rappels déjà programmés.
  if (event !== "created") {
    await tx
      .update(notification)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(notification.appointmentId, appt.id),
          inArray(notification.type, ["reminder_24h", "reminder_2h"]),
          eq(notification.status, "pending"),
        ),
      );
  }

  const canEmailCustomer =
    plan.features.emailNotifications && customer.email && customer.emailOptIn;
  const customerRule: AutomationKey =
    event === "cancelled" ? "cancellation_notice" : "booking_confirmation";
  if (canEmailCustomer && active(customerRule)) {
    const type =
      event === "created"
        ? "booking_confirmation"
        : event === "rescheduled"
          ? "booking_rescheduled"
          : "booking_cancelled";
    rows.push({
      organizationId: org.id,
      appointmentId: appt.id,
      type,
      audience: "customer",
      channel: "email",
      recipient: customer.email!,
      dedupeKey: `${appt.id}:${type}:${event === "rescheduled" ? startsIso : "1"}`,
    });
  }

  if (canEmailCustomer && event !== "cancelled" && plan.features.automaticReminders) {
    for (const r of REMINDERS) {
      if (!active(r.type)) continue;
      const when = new Date(appt.startsAt.getTime() - r.hours * 3_600_000);
      // Rappel inutile si le rendez-vous est déjà plus proche que l'échéance du rappel.
      if (when.getTime() <= Date.now() + 5 * 60_000) continue;
      rows.push({
        organizationId: org.id,
        appointmentId: appt.id,
        type: r.type,
        audience: "customer",
        channel: "email",
        recipient: customer.email!,
        scheduledFor: when,
        dedupeKey: `${appt.id}:${r.type}:${startsIso}`,
      });
    }
  }

  if (active("staff_alerts")) {
    const type =
      event === "created"
        ? "staff_new_booking"
        : event === "rescheduled"
          ? "staff_booking_rescheduled"
          : "staff_booking_cancelled";
    const actorEmail = ctx.actor.kind === "staff" ? ctx.actor.email.toLowerCase() : null;
    for (const email of await staffRecipients(tx, org.id, appt.staffId)) {
      if (email === actorEmail) continue;
      rows.push({
        organizationId: org.id,
        appointmentId: appt.id,
        type,
        audience: "staff",
        // Forfait Free : notification visible dans BookSync uniquement.
        channel: plan.features.emailNotifications ? "email" : "in_app",
        status: plan.features.emailNotifications ? "pending" : "skipped",
        recipient: email,
        dedupeKey: `${appt.id}:${type}:${email}:${event === "cancelled" ? "1" : startsIso}`,
      });
    }
  }

  if (rows.length)
    await tx
      .insert(notification)
      .values(rows)
      .onConflictDoNothing({ target: notification.dedupeKey });
  return rows.length;
}

export async function markNotificationsRead(organizationId: string, email: string, ids?: string[]) {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.organizationId, organizationId),
        eq(notification.audience, "staff"),
        eq(notification.recipient, email.toLowerCase()),
        sql`${notification.readAt} is null`,
        ids?.length ? inArray(notification.id, ids) : undefined,
      ),
    );
}
