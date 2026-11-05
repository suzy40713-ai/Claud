import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { appointment, customer, service, staff, timeOff } from "@/db/schema";
import { can, ForbiddenError } from "@/domain/permissions";
import { optionalText } from "@/domain/validation";
import type { OrgContext } from "@/server/auth/session";
import { cancelAppointment, createAppointment, rescheduleAppointment } from "@/server/booking/book";
import { customerInputSchema } from "@/server/customers/core";
import { NotFoundError, UserError } from "@/server/errors";
import { dispatchSoon } from "@/server/notifications/dispatch";

/** Filtre de visibilité : un employé ne voit que ses propres rendez-vous. */
function scope(ctx: OrgContext): SQL[] {
  const conds: SQL[] = [eq(appointment.organizationId, ctx.organization.id)];
  if (!can(ctx.role, "appointments.manage_all")) {
    conds.push(ctx.staffId ? eq(appointment.staffId, ctx.staffId) : sql`false`);
  }
  return conds;
}

const selection = {
  id: appointment.id,
  startsAt: appointment.startsAt,
  endsAt: appointment.endsAt,
  status: appointment.status,
  source: appointment.source,
  serviceName: appointment.serviceName,
  serviceId: appointment.serviceId,
  priceCents: appointment.priceCents,
  customerNote: appointment.customerNote,
  internalNote: appointment.internalNote,
  staffId: appointment.staffId,
  staffName: staff.displayName,
  staffColor: staff.color,
  serviceColor: service.color,
  customerId: customer.id,
  customerFirstName: customer.firstName,
  customerLastName: customer.lastName,
  customerEmail: customer.email,
  customerPhone: customer.phone,
  cancelledBy: appointment.cancelledBy,
  cancellationReason: appointment.cancellationReason,
  createdAt: appointment.createdAt,
};

export type AppointmentView = Awaited<ReturnType<typeof listAppointmentsInRange>>[number];

export async function listAppointmentsInRange(
  ctx: OrgContext,
  from: Date,
  to: Date,
  staffIds?: string[],
) {
  return db
    .select(selection)
    .from(appointment)
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .leftJoin(service, eq(service.id, appointment.serviceId))
    .where(
      and(
        ...scope(ctx),
        lt(appointment.startsAt, to),
        gte(appointment.endsAt, from),
        staffIds?.length ? inArray(appointment.staffId, staffIds) : undefined,
      ),
    )
    .orderBy(asc(appointment.startsAt))
    .limit(2000);
}

export async function listTimeOffInRange(ctx: OrgContext, from: Date, to: Date) {
  return db
    .select({
      id: timeOff.id,
      staffId: timeOff.staffId,
      startsAt: timeOff.startsAt,
      endsAt: timeOff.endsAt,
      reason: timeOff.reason,
    })
    .from(timeOff)
    .where(
      and(
        eq(timeOff.organizationId, ctx.organization.id),
        lt(timeOff.startsAt, to),
        gte(timeOff.endsAt, from),
      ),
    );
}

export const listSchema = z.object({
  when: z.enum(["upcoming", "past", "all"]).default("upcoming"),
  status: z.enum(["all", "confirmed", "cancelled", "completed", "no_show"]).default("all"),
  staffId: z.uuid().optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const PAGE_SIZE = 25;

export async function listAppointments(ctx: OrgContext, input: z.input<typeof listSchema>) {
  const f = listSchema.parse(input);
  const now = new Date();
  const conds = scope(ctx);
  if (f.when === "upcoming") conds.push(gte(appointment.startsAt, now));
  if (f.when === "past") conds.push(lt(appointment.startsAt, now));
  if (f.status !== "all") conds.push(eq(appointment.status, f.status));
  if (f.staffId) conds.push(eq(appointment.staffId, f.staffId));
  if (f.q) {
    const like = `%${f.q.replace(/[%_]/g, "")}%`;
    conds.push(
      or(
        ilike(customer.firstName, like),
        ilike(customer.lastName, like),
        ilike(customer.email, like),
        ilike(appointment.serviceName, like),
      )!,
    );
  }
  const rows = await db
    .select(selection)
    .from(appointment)
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .leftJoin(service, eq(service.id, appointment.serviceId))
    .where(and(...conds))
    .orderBy(f.when === "past" ? desc(appointment.startsAt) : asc(appointment.startsAt))
    .limit(PAGE_SIZE + 1)
    .offset((f.page - 1) * PAGE_SIZE);
  return { rows: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE, filters: f };
}

async function getScoped(ctx: OrgContext, id: string) {
  const [row] = await db
    .select()
    .from(appointment)
    .where(and(eq(appointment.id, id), ...scope(ctx)))
    .limit(1);
  if (!row) throw new NotFoundError("Rendez-vous introuvable.");
  return row;
}

function assertStaffAllowed(ctx: OrgContext, staffId: string) {
  if (can(ctx.role, "appointments.manage_all")) return;
  if (ctx.staffId !== staffId)
    throw new ForbiddenError("Vous ne pouvez gérer que vos propres rendez-vous.");
}

export const manualAppointmentSchema = z.object({
  serviceId: z.uuid("Choisissez une prestation."),
  staffId: z.uuid("Choisissez un employé."),
  startsAt: z.iso.datetime({ message: "Date et heure invalides." }),
  customerId: z.uuid().nullable(),
  newCustomer: customerInputSchema.nullable(),
  internalNote: optionalText(1000, "La note"),
});

export async function createManualAppointment(
  ctx: OrgContext,
  input: z.input<typeof manualAppointmentSchema>,
) {
  const data = manualAppointmentSchema.parse(input);
  assertStaffAllowed(ctx, data.staffId);
  if (!data.customerId && !data.newCustomer)
    throw new UserError("Choisissez ou créez un client.", {
      customer: "Choisissez ou créez un client.",
    });
  if (data.customerId && !can(ctx.role, "customers.view_all")) {
    // Un employé ne peut rattacher qu'un client déjà venu chez lui.
    const [seen] = await db
      .select({ id: appointment.id })
      .from(appointment)
      .where(
        and(
          eq(appointment.customerId, data.customerId),
          eq(appointment.staffId, ctx.staffId ?? ""),
        ),
      )
      .limit(1);
    if (!seen) throw new ForbiddenError();
  }
  const appt = await createAppointment({
    org: ctx.organization,
    serviceId: data.serviceId,
    staffId: data.staffId,
    startsAt: new Date(data.startsAt),
    source: "manual",
    customer: data.customerId
      ? { id: data.customerId }
      : {
          firstName: data.newCustomer!.firstName,
          lastName: data.newCustomer!.lastName,
          email: data.newCustomer!.email ?? null,
          phone: data.newCustomer!.phone ?? null,
        },
    internalNote: data.internalNote ?? null,
    createdByUserId: ctx.userId,
    actor: { kind: "staff", email: ctx.user.email },
    enforceSchedule: false,
  });
  dispatchSoon();
  return appt;
}

export async function rescheduleByStaff(
  ctx: OrgContext,
  id: string,
  input: { startsAt: string; staffId?: string | null },
) {
  const appt = await getScoped(ctx, id);
  const staffId = input.staffId ?? appt.staffId;
  assertStaffAllowed(ctx, staffId);
  if (input.staffId && input.staffId !== appt.staffId) {
    const [s] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(
        and(
          eq(staff.id, input.staffId),
          eq(staff.organizationId, ctx.organization.id),
          eq(staff.isActive, true),
        ),
      );
    if (!s) throw new UserError("Employé indisponible.");
  }
  const res = await rescheduleAppointment({
    org: ctx.organization,
    appointmentId: appt.id,
    startsAt: new Date(z.iso.datetime({ message: "Date invalide." }).parse(input.startsAt)),
    staffId,
    enforceSchedule: false,
    actor: { kind: "staff", email: ctx.user.email },
  });
  dispatchSoon();
  return res;
}

export async function cancelByStaff(ctx: OrgContext, id: string, reason?: string) {
  const appt = await getScoped(ctx, id);
  await cancelAppointment({
    org: ctx.organization,
    appointmentId: appt.id,
    by: "staff",
    reason: reason?.trim() || null,
    actor: { kind: "staff", email: ctx.user.email },
  });
  dispatchSoon();
}

/** Marque un rendez-vous passé comme honoré ou non honoré (absence), ou le rétablit. */
export async function setAttendance(
  ctx: OrgContext,
  id: string,
  status: "completed" | "no_show" | "confirmed",
) {
  const appt = await getScoped(ctx, id);
  if (appt.status === "cancelled") throw new UserError("Ce rendez-vous est annulé.");
  if (status !== "confirmed" && appt.startsAt > new Date())
    throw new UserError("Ce rendez-vous n'a pas encore eu lieu.");
  await db.update(appointment).set({ status }).where(eq(appointment.id, appt.id));
}

export async function updateInternalNote(ctx: OrgContext, id: string, note: string) {
  const appt = await getScoped(ctx, id);
  const value = optionalText(1000, "La note").parse(note) ?? null;
  await db.update(appointment).set({ internalNote: value }).where(eq(appointment.id, appt.id));
}
