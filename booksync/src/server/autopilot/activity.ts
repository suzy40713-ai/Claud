import "server-only";
import { and, desc, eq, gt, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, autopilotAction, customer, notification } from "@/db/schema";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";

export type ActivityStatus = "done" | "failed" | "skipped" | "pending" | "expired" | "cancelled";

export type ActivityEntry = {
  id: string;
  at: Date;
  title: string;
  detail: string | null;
  status: ActivityStatus;
  error: string | null;
  origin: "automation" | "assistant" | "waitlist" | "user";
};

const NOTIFICATION_TITLES: Record<string, string> = {
  booking_confirmation: "Confirmation de réservation",
  booking_rescheduled: "Modification de rendez-vous",
  booking_cancelled: "Notification d'annulation",
  reminder_24h: "Rappel 24 h",
  reminder_2h: "Rappel 2 h",
  staff_new_booking: "Alerte équipe : nouvelle réservation",
  staff_booking_rescheduled: "Alerte équipe : rendez-vous déplacé",
  staff_booking_cancelled: "Alerte équipe : rendez-vous annulé",
};

const DAYS_30 = 30 * 24 * 3_600_000;

function notificationStatus(status: string, channel: string): ActivityStatus {
  if (status === "sent") return "done";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  // Alerte interne du forfait Free : affichée dans BookSync, sans email.
  if (status === "skipped" && channel === "in_app") return "done";
  if (status === "skipped") return "skipped";
  return "pending";
}

/** Indicateurs de la page Autopilot (30 derniers jours). */
export async function getAutopilotOverview(ctx: OrgContext) {
  assertCan(ctx.role, "autopilot.view");
  const orgId = ctx.organization.id;
  const since = new Date(Date.now() - DAYS_30);
  const [notif] = await db
    .select({
      done: sql<number>`count(*) filter (where ${notification.status} = 'sent' or (${notification.status} = 'skipped' and ${notification.channel} = 'in_app'))`.mapWith(
        Number,
      ),
      failed: sql<number>`count(*) filter (where ${notification.status} = 'failed')`.mapWith(
        Number,
      ),
    })
    .from(notification)
    .where(and(eq(notification.organizationId, orgId), gte(notification.createdAt, since)));
  const [scheduled] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(notification)
    .where(
      and(
        eq(notification.organizationId, orgId),
        eq(notification.status, "pending"),
        gt(notification.scheduledFor, new Date()),
      ),
    );
  const [actions] = await db
    .select({
      done: sql<number>`count(*) filter (where ${autopilotAction.status} = 'done' and ${autopilotAction.createdAt} >= ${since.toISOString()}::timestamptz)`.mapWith(
        Number,
      ),
      failed:
        sql<number>`count(*) filter (where ${autopilotAction.status} = 'failed' and ${autopilotAction.createdAt} >= ${since.toISOString()}::timestamptz)`.mapWith(
          Number,
        ),
      pending: sql<number>`count(*) filter (where ${autopilotAction.status} = 'pending')`.mapWith(
        Number,
      ),
    })
    .from(autopilotAction)
    .where(eq(autopilotAction.organizationId, orgId));
  return {
    done: notif.done + actions.done,
    scheduled: scheduled.n,
    toConfirm: actions.pending,
    errors: notif.failed + actions.failed,
  };
}

/** Historique unifié : notifications traitées par les automatisations + actions Autopilot. */
export async function listActivity(
  ctx: OrgContext,
  opts: { limit?: number; onlyErrors?: boolean } = {},
): Promise<ActivityEntry[]> {
  assertCan(ctx.role, "autopilot.view");
  const orgId = ctx.organization.id;
  const limit = opts.limit ?? 40;
  const notifStatuses = opts.onlyErrors
    ? (["failed"] as const)
    : (["sent", "failed", "skipped", "cancelled"] as const);
  const notifs = await db
    .select({
      id: notification.id,
      type: notification.type,
      status: notification.status,
      channel: notification.channel,
      audience: notification.audience,
      recipient: notification.recipient,
      lastError: notification.lastError,
      at: sql<Date>`coalesce(${notification.sentAt}, ${notification.updatedAt})`.mapWith(
        (v) => new Date(v),
      ),
      firstName: customer.firstName,
      lastName: customer.lastName,
      serviceName: appointment.serviceName,
    })
    .from(notification)
    .leftJoin(appointment, eq(appointment.id, notification.appointmentId))
    .leftJoin(customer, eq(customer.id, appointment.customerId))
    .where(
      and(eq(notification.organizationId, orgId), inArray(notification.status, [...notifStatuses])),
    )
    .orderBy(desc(notification.updatedAt))
    .limit(limit);
  const actions = await db
    .select()
    .from(autopilotAction)
    .where(
      and(
        eq(autopilotAction.organizationId, orgId),
        opts.onlyErrors ? eq(autopilotAction.status, "failed") : undefined,
      ),
    )
    .orderBy(desc(autopilotAction.createdAt))
    .limit(limit);

  const entries: ActivityEntry[] = [
    ...notifs.map((n) => {
      const who =
        n.audience === "customer" && n.firstName
          ? `${n.firstName} ${n.lastName}`
          : n.channel === "in_app"
            ? `${n.recipient} (dans BookSync)`
            : n.recipient;
      return {
        id: `n-${n.id}`,
        at: n.at,
        title: NOTIFICATION_TITLES[n.type] ?? n.type,
        detail: [who, n.serviceName].filter(Boolean).join(" · ") || null,
        status: notificationStatus(n.status, n.channel),
        error: n.status === "failed" || n.status === "skipped" ? n.lastError : null,
        origin: "automation" as const,
      };
    }),
    ...actions.map((a) => ({
      id: `a-${a.id}`,
      at: a.decidedAt ?? a.createdAt,
      title: a.summary,
      detail: null,
      status: a.status,
      error: a.error,
      origin: a.source,
    })),
  ];
  return entries.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** Prochaines actions programmées (rappels à venir). */
export async function listScheduled(ctx: OrgContext, limit = 8) {
  assertCan(ctx.role, "autopilot.view");
  return db
    .select({
      id: notification.id,
      type: notification.type,
      scheduledFor: notification.scheduledFor,
      firstName: customer.firstName,
      lastName: customer.lastName,
      serviceName: appointment.serviceName,
    })
    .from(notification)
    .innerJoin(appointment, eq(appointment.id, notification.appointmentId))
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .where(
      and(
        eq(notification.organizationId, ctx.organization.id),
        eq(notification.status, "pending"),
        gt(notification.scheduledFor, new Date()),
      ),
    )
    .orderBy(notification.scheduledFor)
    .limit(limit);
}

export { NOTIFICATION_TITLES };
