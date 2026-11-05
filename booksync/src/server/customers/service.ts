import "server-only";
import { and, asc, count, desc, eq, ilike, max, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { appointment, customer, staff } from "@/db/schema";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { NotFoundError, pgErrorCode, UserError } from "@/server/errors";
import { assertCustomerRoom, customerInputSchema, lockCustomers } from "./core";

export async function listCustomers(ctx: OrgContext, opts: { q?: string; page?: number }) {
  assertCan(ctx.role, "customers.view_all");
  const page = Math.max(1, opts.page ?? 1);
  const size = 30;
  const q = opts.q?.trim().slice(0, 80);
  const like = q ? `%${q.replace(/[%_]/g, "")}%` : null;
  const rows = await db
    .select({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      bookings: count(appointment.id),
      lastVisit: max(appointment.startsAt),
    })
    .from(customer)
    .leftJoin(
      appointment,
      and(eq(appointment.customerId, customer.id), sql`${appointment.status} <> 'cancelled'`),
    )
    .where(
      and(
        eq(customer.organizationId, ctx.organization.id),
        like
          ? or(
              ilike(customer.firstName, like),
              ilike(customer.lastName, like),
              ilike(customer.email, like),
              ilike(customer.phone, like),
              ilike(sql`${customer.firstName} || ' ' || ${customer.lastName}`, like),
            )
          : undefined,
      ),
    )
    .groupBy(customer.id)
    .orderBy(asc(customer.lastName), asc(customer.firstName))
    .limit(size + 1)
    .offset((page - 1) * size);
  const [total] = await db
    .select({ n: count() })
    .from(customer)
    .where(eq(customer.organizationId, ctx.organization.id));
  return { rows: rows.slice(0, size), hasMore: rows.length > size, total: total.n, page };
}

export async function getCustomer(ctx: OrgContext, id: string) {
  assertCan(ctx.role, "customers.view_all");
  const [row] = await db
    .select()
    .from(customer)
    .where(and(eq(customer.id, id), eq(customer.organizationId, ctx.organization.id)))
    .limit(1);
  if (!row) throw new NotFoundError("Client introuvable.");
  const history = await db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      status: appointment.status,
      serviceName: appointment.serviceName,
      priceCents: appointment.priceCents,
      staffName: staff.displayName,
    })
    .from(appointment)
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .where(and(eq(appointment.customerId, id), eq(appointment.organizationId, ctx.organization.id)))
    .orderBy(desc(appointment.startsAt))
    .limit(200);
  const stats = {
    total: history.filter((h) => h.status !== "cancelled").length,
    completed: history.filter((h) => h.status === "completed").length,
    noShow: history.filter((h) => h.status === "no_show").length,
    cancelled: history.filter((h) => h.status === "cancelled").length,
    revenueCents: history
      .filter((h) => h.status === "completed")
      .reduce((s, h) => s + h.priceCents, 0),
  };
  return { customer: row, history, stats };
}

/** Recherche rapide (création de rendez-vous). Un employé ne voit que ses propres clients. */
export async function searchCustomers(ctx: OrgContext, q: string) {
  const like = `%${q.trim().slice(0, 60).replace(/[%_]/g, "")}%`;
  const own = ctx.role === "employee";
  return db
    .selectDistinct({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
    })
    .from(customer)
    .leftJoin(appointment, eq(appointment.customerId, customer.id))
    .where(
      and(
        eq(customer.organizationId, ctx.organization.id),
        own ? eq(appointment.staffId, ctx.staffId ?? "") : undefined,
        or(
          ilike(customer.firstName, like),
          ilike(customer.lastName, like),
          ilike(customer.email, like),
          ilike(customer.phone, like),
          ilike(sql`${customer.firstName} || ' ' || ${customer.lastName}`, like),
        ),
      ),
    )
    .limit(8);
}

export async function createCustomer(ctx: OrgContext, input: z.input<typeof customerInputSchema>) {
  assertCan(ctx.role, "customers.manage");
  const data = customerInputSchema.parse(input);
  try {
    return await db.transaction(async (tx) => {
      await lockCustomers(tx, ctx.organization.id);
      await assertCustomerRoom(tx, ctx.organization.id, ctx.plan);
      const [row] = await tx
        .insert(customer)
        .values({ ...data, organizationId: ctx.organization.id })
        .returning();
      return row;
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505")
      throw new UserError("Un client existe déjà avec cet email.", {
        email: "Un client existe déjà avec cet email.",
      });
    throw error;
  }
}

export async function updateCustomer(
  ctx: OrgContext,
  id: string,
  input: z.input<typeof customerInputSchema>,
) {
  assertCan(ctx.role, "customers.manage");
  const data = customerInputSchema.parse(input);
  try {
    const res = await db
      .update(customer)
      .set(data)
      .where(and(eq(customer.id, id), eq(customer.organizationId, ctx.organization.id)))
      .returning({ id: customer.id });
    if (!res.length) throw new NotFoundError("Client introuvable.");
  } catch (error) {
    if (pgErrorCode(error) === "23505")
      throw new UserError("Un client existe déjà avec cet email.", {
        email: "Un client existe déjà avec cet email.",
      });
    throw error;
  }
}

/** Suppression (droit à l'effacement) : supprime aussi l'historique de ses rendez-vous. Refusée si rendez-vous à venir. */
export async function deleteCustomer(ctx: OrgContext, id: string) {
  assertCan(ctx.role, "customers.manage");
  const [upcoming] = await db
    .select({ n: count() })
    .from(appointment)
    .where(
      and(
        eq(appointment.customerId, id),
        eq(appointment.organizationId, ctx.organization.id),
        eq(appointment.status, "confirmed"),
        sql`${appointment.startsAt} > now()`,
      ),
    );
  if (upcoming.n > 0)
    throw new UserError(
      "Ce client a des rendez-vous à venir. Annulez-les avant de supprimer sa fiche.",
    );
  const res = await db
    .delete(customer)
    .where(and(eq(customer.id, id), eq(customer.organizationId, ctx.organization.id)))
    .returning({ id: customer.id });
  if (!res.length) throw new NotFoundError("Client introuvable.");
}
