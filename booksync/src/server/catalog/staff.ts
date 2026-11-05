import "server-only";
import { TZDate } from "@date-fns/tz";
import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { member, service, staff, staffService, timeOff, user, workingHours } from "@/db/schema";
import { assertCan, can, ForbiddenError } from "@/domain/permissions";
import {
  groupByWeekday,
  validateWeek,
  weekToRows,
  type WeeklyHours,
} from "@/domain/schedule/hours";
import { hexColor, optionalText } from "@/domain/validation";
import type { OrgContext } from "@/server/auth/session";
import { NotFoundError, UserError } from "@/server/errors";
import { deleteFile, storeImage } from "@/server/files";

/** Un employé ne peut gérer que son propre planning ; propriétaire et administrateurs gèrent tous les plannings. */
function assertCanManageStaff(ctx: OrgContext, staffId: string) {
  if (can(ctx.role, "schedule.manage_all")) return;
  if (can(ctx.role, "schedule.manage_own") && ctx.staffId === staffId) return;
  throw new ForbiddenError();
}

export async function listStaff(organizationId: string, opts: { activeOnly?: boolean } = {}) {
  return db
    .select({
      id: staff.id,
      displayName: staff.displayName,
      photoFileId: staff.photoFileId,
      color: staff.color,
      isBookable: staff.isBookable,
      isActive: staff.isActive,
      memberId: staff.memberId,
      email: user.email,
      role: member.role,
    })
    .from(staff)
    .leftJoin(member, eq(member.id, staff.memberId))
    .leftJoin(user, eq(user.id, member.userId))
    .where(
      and(
        eq(staff.organizationId, organizationId),
        opts.activeOnly ? eq(staff.isActive, true) : undefined,
      ),
    )
    .orderBy(asc(staff.position), asc(staff.createdAt));
}

export async function getStaffDetail(ctx: OrgContext, staffId: string) {
  assertCanManageStaff(ctx, staffId);
  const [row] = await db
    .select({ staff, email: user.email, role: member.role })
    .from(staff)
    .leftJoin(member, eq(member.id, staff.memberId))
    .leftJoin(user, eq(user.id, member.userId))
    .where(and(eq(staff.id, staffId), eq(staff.organizationId, ctx.organization.id)))
    .limit(1);
  if (!row) throw new NotFoundError("Employé introuvable.");
  const hours = await db
    .select()
    .from(workingHours)
    .where(
      and(eq(workingHours.organizationId, ctx.organization.id), eq(workingHours.staffId, staffId)),
    );
  const serviceIds = await db
    .select({ id: staffService.serviceId })
    .from(staffService)
    .where(
      and(eq(staffService.organizationId, ctx.organization.id), eq(staffService.staffId, staffId)),
    );
  const services = await db
    .select({ id: service.id, name: service.name, durationMinutes: service.durationMinutes })
    .from(service)
    .where(and(eq(service.organizationId, ctx.organization.id), isNull(service.deletedAt)))
    .orderBy(asc(service.position));
  const absences = await listTimeOff(ctx.organization.id, staffId);
  return {
    ...row.staff,
    email: row.email,
    role: row.role,
    week: groupByWeekday(hours),
    serviceIds: serviceIds.map((s) => s.id),
    services,
    absences,
  };
}

export const staffProfileSchema = z.object({
  displayName: z.string().trim().min(2, "2 caractères minimum.").max(80, "80 caractères maximum."),
  bio: optionalText(300, "La présentation"),
  color: hexColor,
  isBookable: z.boolean(),
});

export async function updateStaffProfile(
  ctx: OrgContext,
  staffId: string,
  input: z.input<typeof staffProfileSchema>,
) {
  assertCanManageStaff(ctx, staffId);
  const data = staffProfileSchema.parse(input);
  // Seuls propriétaire et administrateurs décident qui est réservable en ligne.
  if (!can(ctx.role, "staff.manage_all")) delete (data as Partial<typeof data>).isBookable;
  const res = await db
    .update(staff)
    .set(data)
    .where(and(eq(staff.id, staffId), eq(staff.organizationId, ctx.organization.id)))
    .returning({ id: staff.id });
  if (!res.length) throw new NotFoundError("Employé introuvable.");
}

export async function setStaffPhoto(ctx: OrgContext, staffId: string, upload: File | null) {
  assertCanManageStaff(ctx, staffId);
  const [row] = await db
    .select({ photoFileId: staff.photoFileId })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.organizationId, ctx.organization.id)));
  if (!row) throw new NotFoundError("Employé introuvable.");
  const id = upload ? await storeImage(ctx.organization.id, "staff_photo", upload) : null;
  await db.update(staff).set({ photoFileId: id }).where(eq(staff.id, staffId));
  await deleteFile(ctx.organization.id, row.photoFileId);
}

export async function setStaffServices(ctx: OrgContext, staffId: string, serviceIds: string[]) {
  assertCan(ctx.role, "staff.manage_all");
  const ids = z.array(z.uuid()).max(200).parse(serviceIds);
  await db.transaction(async (tx) => {
    await tx
      .delete(staffService)
      .where(
        and(
          eq(staffService.organizationId, ctx.organization.id),
          eq(staffService.staffId, staffId),
        ),
      );
    // Les clés étrangères composites garantissent que service et employé sont de la même entreprise.
    if (ids.length) {
      await tx
        .insert(staffService)
        .values(
          ids.map((serviceId) => ({ organizationId: ctx.organization.id, staffId, serviceId })),
        );
    }
  });
}

const weekSchema = z.record(
  z.string(),
  z.array(z.object({ startMinute: z.number().int(), endMinute: z.number().int() })),
);

/** Remplace les horaires hebdomadaires d'un employé (staffId) ou de l'entreprise (staffId = null). */
export async function setWeeklyHours(ctx: OrgContext, staffId: string | null, input: unknown) {
  if (staffId) assertCanManageStaff(ctx, staffId);
  else assertCan(ctx.role, "closures.manage");
  const raw = weekSchema.parse(input);
  const week: WeeklyHours = {};
  for (let d = 1; d <= 7; d++) week[d] = raw[String(d)] ?? [];
  const error = validateWeek(week);
  if (error) throw new UserError(error.message);
  if (staffId) {
    const [s] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.organizationId, ctx.organization.id)));
    if (!s) throw new NotFoundError("Employé introuvable.");
  }
  await db.transaction(async (tx) => {
    await tx
      .delete(workingHours)
      .where(
        and(
          eq(workingHours.organizationId, ctx.organization.id),
          staffId ? eq(workingHours.staffId, staffId) : isNull(workingHours.staffId),
        ),
      );
    const rows = weekToRows(week);
    if (rows.length) {
      await tx
        .insert(workingHours)
        .values(rows.map((r) => ({ ...r, organizationId: ctx.organization.id, staffId })));
    }
  });
}

export async function getOrganizationHours(organizationId: string) {
  const rows = await db
    .select()
    .from(workingHours)
    .where(and(eq(workingHours.organizationId, organizationId), isNull(workingHours.staffId)));
  return groupByWeekday(rows);
}

/* ─────────────────────── Absences et fermetures ─────────────────────── */

export async function listTimeOff(organizationId: string, staffId: string | null) {
  return db
    .select()
    .from(timeOff)
    .where(
      and(
        eq(timeOff.organizationId, organizationId),
        staffId ? eq(timeOff.staffId, staffId) : isNull(timeOff.staffId),
        gte(timeOff.endsAt, sql`now() - interval '1 day'`),
      ),
    )
    .orderBy(asc(timeOff.startsAt))
    .limit(100);
}

export const timeOffSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide."),
    allDay: z.boolean().default(true),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    reason: optionalText(120, "Le motif"),
  })
  .refine((v) => v.allDay || (v.startTime && v.endTime), {
    message: "Indiquez les heures.",
    path: ["startTime"],
  });

/** Convertit une date et une heure locales (fuseau de l'entreprise) en instant UTC. */
export function addDaysToIsoDate(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function localToUtc(date: string, time: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, timeZone).getTime());
}

export async function addTimeOff(
  ctx: OrgContext,
  staffId: string | null,
  input: z.input<typeof timeOffSchema>,
) {
  if (staffId) assertCanManageStaff(ctx, staffId);
  else assertCan(ctx.role, "closures.manage");
  const data = timeOffSchema.parse(input);
  const tz = ctx.organization.timezone;
  const startsAt = localToUtc(data.startDate, data.allDay ? "00:00" : data.startTime!, tz);
  // Journée entière : de minuit le premier jour à minuit le lendemain du dernier jour (heure locale).
  const endsAt = data.allDay
    ? localToUtc(addDaysToIsoDate(data.endDate, 1), "00:00", tz)
    : localToUtc(data.endDate, data.endTime!, tz);
  if (endsAt <= startsAt)
    throw new UserError("La fin doit être après le début.", {
      endDate: "La fin doit être après le début.",
    });
  if (staffId) {
    const [s] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.organizationId, ctx.organization.id)));
    if (!s) throw new NotFoundError("Employé introuvable.");
  }
  const [row] = await db
    .insert(timeOff)
    .values({
      organizationId: ctx.organization.id,
      staffId,
      startsAt,
      endsAt,
      reason: data.reason ?? null,
    })
    .returning();
  return row;
}

export async function removeTimeOff(ctx: OrgContext, id: string) {
  const [row] = await db
    .select()
    .from(timeOff)
    .where(and(eq(timeOff.id, id), eq(timeOff.organizationId, ctx.organization.id)));
  if (!row) throw new NotFoundError("Absence introuvable.");
  if (row.staffId) assertCanManageStaff(ctx, row.staffId);
  else assertCan(ctx.role, "closures.manage");
  await db.delete(timeOff).where(eq(timeOff.id, id));
}
