import "server-only";
import { and, count, desc, eq, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, customer, staff } from "@/db/schema";
import { can } from "@/domain/permissions";
import {
  localMinuteToInstant,
  addDays,
  localDateOf,
  isoWeekday,
} from "@/domain/availability/engine";
import type { OrgContext } from "@/server/auth/session";

/** Un employé ne voit que ses propres chiffres. */
function scope(ctx: OrgContext): SQL[] {
  const c: SQL[] = [eq(appointment.organizationId, ctx.organization.id)];
  if (!can(ctx.role, "stats.view") || !can(ctx.role, "appointments.manage_all"))
    c.push(ctx.staffId ? eq(appointment.staffId, ctx.staffId) : sql`false`);
  return c;
}

const midnight = (date: string, tz: string) => localMinuteToInstant(date, 0, tz)!;

/** Premier jour du mois, `months` mois avant la date donnée (AAAA-MM-01). */
function firstOfMonthMonthsAgo(date: string, months: number) {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 - months, 1)).toISOString().slice(0, 10);
}

/**
 * Chiffre d'affaires enregistré = prix des rendez-vous honorés, ou passés et toujours confirmés
 * (non marqués absents). Les annulations et absences ne comptent pas.
 */
const revenueExpr = sql<number>`coalesce(sum(case when ${appointment.status} = 'completed' or (${appointment.status} = 'confirmed' and ${appointment.startsAt} < now()) then ${appointment.priceCents} else 0 end), 0)::int`;

export async function getOverview(ctx: OrgContext) {
  const tz = ctx.organization.timezone;
  const today = localDateOf(new Date(), tz);
  const weekStart = addDays(today, 1 - isoWeekday(today));
  const monthStart = `${today.slice(0, 8)}01`;
  const [y, m] = today.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  const active = inArray(appointment.status, ["confirmed", "completed", "no_show"]);
  const base = scope(ctx);

  const countBetween = async (from: string, to: string) => {
    const [r] = await db
      .select({ n: count() })
      .from(appointment)
      .where(
        and(
          ...base,
          active,
          gte(appointment.startsAt, midnight(from, tz)),
          lt(appointment.startsAt, midnight(to, tz)),
        ),
      );
    return r.n;
  };

  const [todayCount, weekCount, [{ revenue }], [{ customers }], upcoming, recent, daily] =
    await Promise.all([
      countBetween(today, addDays(today, 1)),
      countBetween(weekStart, addDays(weekStart, 7)),
      db
        .select({ revenue: revenueExpr })
        .from(appointment)
        .where(
          and(
            ...base,
            gte(appointment.startsAt, midnight(monthStart, tz)),
            lt(appointment.startsAt, midnight(nextMonth, tz)),
          ),
        ),
      can(ctx.role, "customers.view_all")
        ? db
            .select({ customers: count() })
            .from(customer)
            .where(eq(customer.organizationId, ctx.organization.id))
        : db
            .select({ customers: sql<number>`count(distinct ${appointment.customerId})::int` })
            .from(appointment)
            .where(and(...base)),
      db
        .select({
          id: appointment.id,
          startsAt: appointment.startsAt,
          serviceName: appointment.serviceName,
          staffName: staff.displayName,
          staffColor: staff.color,
          firstName: customer.firstName,
          lastName: customer.lastName,
        })
        .from(appointment)
        .innerJoin(staff, eq(staff.id, appointment.staffId))
        .innerJoin(customer, eq(customer.id, appointment.customerId))
        .where(
          and(...base, eq(appointment.status, "confirmed"), gte(appointment.startsAt, new Date())),
        )
        .orderBy(appointment.startsAt)
        .limit(6),
      db
        .select({
          id: appointment.id,
          createdAt: appointment.createdAt,
          startsAt: appointment.startsAt,
          source: appointment.source,
          status: appointment.status,
          serviceName: appointment.serviceName,
          firstName: customer.firstName,
          lastName: customer.lastName,
        })
        .from(appointment)
        .innerJoin(customer, eq(customer.id, appointment.customerId))
        .where(and(...base))
        .orderBy(desc(appointment.createdAt))
        .limit(6),
      db
        .select({
          day: sql<string>`to_char(${appointment.startsAt} at time zone ${tz}, 'YYYY-MM-DD')`,
          n: sql<number>`count(*)::int`,
        })
        .from(appointment)
        .where(
          and(
            ...base,
            active,
            gte(appointment.startsAt, midnight(addDays(today, -29), tz)),
            lt(appointment.startsAt, midnight(addDays(today, 1), tz)),
          ),
        )
        .groupBy(sql`1`),
    ]);

  const series = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(today, i - 29);
    return { date: d, count: daily.find((r) => r.day === d)?.n ?? 0 };
  });
  return { todayCount, weekCount, revenueCents: revenue, customers, upcoming, recent, series };
}

export type AnalyticsRange = { from: string; to: string };

export async function getAnalytics(ctx: OrgContext, range: AnalyticsRange) {
  const tz = ctx.organization.timezone;
  const base = [
    ...scope(ctx),
    gte(appointment.startsAt, midnight(range.from, tz)),
    lt(appointment.startsAt, midnight(addDays(range.to, 1), tz)),
  ];
  const advanced = ctx.plan.features.advancedStats;

  const [[totals], services, staffRows, monthly, weekdays, sources] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        cancelled: sql<number>`count(*) filter (where ${appointment.status} = 'cancelled')::int`,
        noShow: sql<number>`count(*) filter (where ${appointment.status} = 'no_show')::int`,
        pastActive: sql<number>`count(*) filter (where ${appointment.status} in ('completed','no_show') or (${appointment.status} = 'confirmed' and ${appointment.startsAt} < now()))::int`,
        revenue: revenueExpr,
      })
      .from(appointment)
      .where(and(...base)),
    db
      .select({
        name: appointment.serviceName,
        n: sql<number>`count(*)::int`,
        revenue: revenueExpr,
      })
      .from(appointment)
      .where(and(...base, sql`${appointment.status} <> 'cancelled'`))
      .groupBy(appointment.serviceName)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
    advanced
      ? db
          .select({
            name: staff.displayName,
            color: staff.color,
            n: sql<number>`count(*) filter (where ${appointment.status} <> 'cancelled')::int`,
            noShow: sql<number>`count(*) filter (where ${appointment.status} = 'no_show')::int`,
            revenue: revenueExpr,
          })
          .from(appointment)
          .innerJoin(staff, eq(staff.id, appointment.staffId))
          .where(and(...base))
          .groupBy(staff.id, staff.displayName, staff.color)
          .orderBy(desc(sql`3`))
      : Promise.resolve([]),
    advanced
      ? db
          .select({
            month: sql<string>`to_char(${appointment.startsAt} at time zone ${tz}, 'YYYY-MM')`,
            n: sql<number>`count(*) filter (where ${appointment.status} <> 'cancelled')::int`,
            cancelled: sql<number>`count(*) filter (where ${appointment.status} = 'cancelled')::int`,
            revenue: revenueExpr,
          })
          .from(appointment)
          .where(
            and(
              ...scope(ctx),
              gte(
                appointment.startsAt,
                midnight(firstOfMonthMonthsAgo(localDateOf(new Date(), tz), 11), tz),
              ),
            ),
          )
          .groupBy(sql`1`)
          .orderBy(sql`1`)
      : Promise.resolve([]),
    advanced
      ? db
          .select({
            dow: sql<number>`extract(isodow from ${appointment.startsAt} at time zone ${tz})::int`,
            n: sql<number>`count(*)::int`,
          })
          .from(appointment)
          .where(and(...base, sql`${appointment.status} <> 'cancelled'`))
          .groupBy(sql`1`)
      : Promise.resolve([]),
    advanced
      ? db
          .select({ source: appointment.source, n: sql<number>`count(*)::int` })
          .from(appointment)
          .where(and(...base, sql`${appointment.status} <> 'cancelled'`))
          .groupBy(appointment.source)
      : Promise.resolve([]),
  ]);

  return {
    advanced,
    totals: {
      bookings: totals.total - totals.cancelled,
      revenueCents: totals.revenue,
      cancellationRate: totals.total ? totals.cancelled / totals.total : 0,
      noShowRate: totals.pastActive ? totals.noShow / totals.pastActive : 0,
      cancelled: totals.cancelled,
      noShow: totals.noShow,
    },
    services,
    staff: staffRows,
    monthly,
    weekdays: Array.from({ length: 7 }, (_, i) => ({
      dow: i + 1,
      n: weekdays.find((w) => w.dow === i + 1)?.n ?? 0,
    })),
    sources,
  };
}
