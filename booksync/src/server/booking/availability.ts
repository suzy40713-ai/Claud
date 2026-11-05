import "server-only";
import { and, eq, gt, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  appointment,
  organization,
  service,
  staff,
  staffService,
  timeOff,
  workingHours,
} from "@/db/schema";
import {
  addDays,
  computeAvailability,
  localMinuteToInstant,
  type AvailabilityInput,
  type Interval,
} from "@/domain/availability/engine";
import { groupByWeekday } from "@/domain/schedule/hours";

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type BookableService = typeof service.$inferSelect;
export type OrgRow = typeof organization.$inferSelect;

/** Employés actifs et réservables qui réalisent ce service. */
export async function staffForService(ex: Executor, organizationId: string, serviceId: string) {
  return ex
    .select({
      id: staff.id,
      displayName: staff.displayName,
      photoFileId: staff.photoFileId,
      color: staff.color,
      bio: staff.bio,
    })
    .from(staffService)
    .innerJoin(staff, eq(staff.id, staffService.staffId))
    .where(
      and(
        eq(staffService.organizationId, organizationId),
        eq(staffService.serviceId, serviceId),
        eq(staff.isActive, true),
        eq(staff.isBookable, true),
      ),
    )
    .orderBy(staff.position, staff.createdAt);
}

/**
 * Construit l'entrée du moteur de disponibilités à partir de la base.
 * `excludeAppointmentId` : rendez-vous ignoré (cas d'un déplacement de ce même rendez-vous).
 */
export async function loadAvailabilityInput(
  ex: Executor,
  org: OrgRow,
  svc: Pick<BookableService, "durationMinutes" | "bufferAfterMinutes">,
  staffIds: string[],
  fromDate: string,
  toDate: string,
  opts: { now?: Date; excludeAppointmentId?: string; ignoreNotice?: boolean } = {},
): Promise<AvailabilityInput> {
  const tz = org.timezone;
  // Fenêtre UTC large (±1 jour) couvrant toute la période locale demandée.
  const windowStart =
    localMinuteToInstant(addDays(fromDate, -1), 0, tz) ?? new Date(`${fromDate}T00:00:00Z`);
  const windowEnd =
    localMinuteToInstant(addDays(toDate, 2), 0, tz) ?? new Date(`${toDate}T23:59:59Z`);

  const [hours, busyAppointments, absences] = staffIds.length
    ? await Promise.all([
        ex
          .select()
          .from(workingHours)
          .where(
            and(eq(workingHours.organizationId, org.id), inArray(workingHours.staffId, staffIds)),
          ),
        ex
          .select({
            staffId: appointment.staffId,
            start: appointment.startsAt,
            end: appointment.blockedUntil,
          })
          .from(appointment)
          .where(
            and(
              eq(appointment.organizationId, org.id),
              inArray(appointment.staffId, staffIds),
              inArray(appointment.status, ["confirmed", "completed", "no_show"]),
              lt(appointment.startsAt, windowEnd),
              gt(appointment.blockedUntil, windowStart),
              opts.excludeAppointmentId ? ne(appointment.id, opts.excludeAppointmentId) : undefined,
            ),
          ),
        ex
          .select({ staffId: timeOff.staffId, start: timeOff.startsAt, end: timeOff.endsAt })
          .from(timeOff)
          .where(
            and(
              eq(timeOff.organizationId, org.id),
              or(isNull(timeOff.staffId), inArray(timeOff.staffId, staffIds)),
              lt(timeOff.startsAt, windowEnd),
              gt(timeOff.endsAt, windowStart),
            ),
          ),
      ])
    : [[], [], []];

  const closures: Interval[] = absences
    .filter((a) => a.staffId === null)
    .map((a) => ({ start: a.start, end: a.end }));
  return {
    timeZone: tz,
    fromDate,
    toDate,
    now: opts.now ?? new Date(),
    minNoticeMinutes: opts.ignoreNotice ? 0 : org.minNoticeMinutes,
    maxAdvanceDays: opts.ignoreNotice ? 730 : org.maxAdvanceDays,
    slotIntervalMinutes: org.slotIntervalMinutes,
    durationMinutes: svc.durationMinutes,
    bufferAfterMinutes: svc.bufferAfterMinutes,
    closures,
    staff: staffIds.map((id) => ({
      id,
      week: groupByWeekday(hours.filter((h) => h.staffId === id)),
      busy: [
        ...busyAppointments
          .filter((b) => b.staffId === id)
          .map((b) => ({ start: b.start, end: b.end })),
        ...absences.filter((a) => a.staffId === id).map((a) => ({ start: a.start, end: a.end })),
      ],
    })),
  };
}

export async function getAvailability(
  org: OrgRow,
  svc: BookableService,
  staffIds: string[],
  fromDate: string,
  toDate: string,
) {
  const input = await loadAvailabilityInput(db, org, svc, staffIds, fromDate, toDate);
  return computeAvailability(input);
}

/** Nombre de rendez-vous actifs par employé et par jour (pour répartir la charge). */
export async function countActive(ex: Executor, organizationId: string) {
  return ex
    .select({ n: sql<number>`count(*)::int` })
    .from(appointment)
    .where(
      and(eq(appointment.organizationId, organizationId), eq(appointment.status, "confirmed")),
    );
}
