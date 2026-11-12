import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, customer } from "@/db/schema";
import { isAutomationActive } from "@/domain/autopilot/automations";
import { analyzeBookings, type InsightAppointment } from "@/domain/insights/analyze";
import { assertCan, ForbiddenError } from "@/domain/permissions";
import { formatInTz } from "@/lib/format";
import type { OrgContext } from "@/server/auth/session";
import { loadStoredRules } from "@/server/autopilot/rules";
import { groupByWeekday } from "@/domain/schedule/hours";
import { workingHours } from "@/db/schema";
import { getOrganizationHours } from "@/server/catalog/staff";

/** Horaires d'ouverture de l'entreprise, ou à défaut l'union des horaires de l'équipe. */
async function openingHoursOf(organizationId: string) {
  const org = await getOrganizationHours(organizationId);
  if (Object.values(org).some((r) => r.length)) return org;
  const rows = await db
    .select()
    .from(workingHours)
    .where(eq(workingHours.organizationId, organizationId));
  return groupByWeekday(rows);
}

const MAX_ROWS = 20_000;

/** Rendez-vous des 12 derniers mois et des 2 semaines à venir, convertis dans le fuseau de l'entreprise. */
export async function loadInsightAppointments(
  organizationId: string,
  timeZone: string,
  now = new Date(),
): Promise<InsightAppointment[]> {
  const rows = await db
    .select({
      startsAt: appointment.startsAt,
      status: appointment.status,
      cancelledAt: appointment.cancelledAt,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      priceCents: appointment.priceCents,
      customerId: appointment.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
    })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .where(
      and(
        eq(appointment.organizationId, organizationId),
        gte(appointment.startsAt, new Date(now.getTime() - 365 * 86_400_000)),
      ),
    )
    .limit(MAX_ROWS);
  return rows.map((r) => ({
    startsAt: r.startsAt,
    status: r.status,
    cancelledAt: r.cancelledAt,
    serviceId: r.serviceId,
    serviceName: r.serviceName,
    priceCents: r.priceCents ?? 0,
    customerId: r.customerId,
    customerName: `${r.firstName} ${r.lastName}`,
    weekday: Number(formatInTz(r.startsAt, timeZone, "i")),
    hour: Number(formatInTz(r.startsAt, timeZone, "H")),
  }));
}

/** Analyse de l'activité (forfait Pro) : tendances, horaires, clients et recommandations. */
export async function getInsights(ctx: OrgContext, now = new Date()) {
  assertCan(ctx.role, "stats.view");
  if (!ctx.plan.features.advancedStats)
    throw new ForbiddenError(
      "L'analyse intelligente de l'activité est incluse dans le forfait Pro.",
    );
  const orgId = ctx.organization.id;
  const [appointments, openingHours, rules] = await Promise.all([
    loadInsightAppointments(orgId, ctx.organization.timezone, now),
    openingHoursOf(orgId),
    loadStoredRules(db, orgId),
  ]);
  return analyzeBookings({
    appointments,
    now,
    openingHours,
    automations: {
      reminders: isAutomationActive("reminder_24h", ctx.plan.id, rules),
      waitlist: isAutomationActive("waitlist", ctx.plan.id, rules),
      waitlistAvailable: ctx.plan.id === "pro",
    },
  });
}
