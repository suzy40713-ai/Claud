import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, customer, notification } from "@/db/schema";
import { can } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";

export async function listMyNotifications(ctx: OrgContext) {
  return db
    .select({
      id: notification.id,
      type: notification.type,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      channel: notification.channel,
      startsAt: appointment.startsAt,
      serviceName: appointment.serviceName,
      firstName: customer.firstName,
      lastName: customer.lastName,
    })
    .from(notification)
    .leftJoin(appointment, eq(appointment.id, notification.appointmentId))
    .leftJoin(customer, eq(customer.id, appointment.customerId))
    .where(
      and(
        eq(notification.organizationId, ctx.organization.id),
        eq(notification.audience, "staff"),
        eq(notification.recipient, ctx.user.email.toLowerCase()),
      ),
    )
    .orderBy(desc(notification.createdAt))
    .limit(100);
}

/** Journal des emails envoyés aux clients (propriétaire et administrateurs). */
export async function listCustomerDeliveries(ctx: OrgContext) {
  if (!can(ctx.role, "appointments.manage_all")) return [];
  return db
    .select({
      id: notification.id,
      type: notification.type,
      recipient: notification.recipient,
      status: notification.status,
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt,
      attempts: notification.attempts,
      lastError: notification.lastError,
    })
    .from(notification)
    .where(
      and(
        eq(notification.organizationId, ctx.organization.id),
        eq(notification.audience, "customer"),
      ),
    )
    .orderBy(desc(notification.scheduledFor))
    .limit(100);
}
