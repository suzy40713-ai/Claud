import "server-only";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { autopilotAction, service, waitlistEntry, waitlistOffer } from "@/db/schema";
import { isoWeekday, isSlotAvailable, localDateOf } from "@/domain/availability/engine";
import { effectivePlan } from "@/domain/billing/plans";
import {
  matchWaitlist,
  offerExpiry,
  type ServiceFit,
  type WaitlistCandidate,
} from "@/domain/waitlist/match";
import { formatInTz } from "@/lib/format";
import { loadActiveChecker } from "@/server/autopilot/rules";
import { loadAvailabilityInput, staffForService, type OrgRow } from "@/server/booking/availability";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Un créneau vient de se libérer (annulation ou déplacement) : on le propose aux inscrits compatibles.
 * Appelé DANS la transaction qui libère le créneau ; les emails partent ensuite (processWaitlist).
 * Retourne le nombre de propositions créées.
 */
export async function offerFreedSlot(
  tx: Tx,
  org: OrgRow,
  slot: { staffId: string; startsAt: Date },
  now = new Date(),
): Promise<number> {
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  const active = await loadActiveChecker(tx, org.id, plan.id);
  if (!active("waitlist")) return 0;
  const expiresAt = offerExpiry(now, slot.startsAt);
  if (!expiresAt) return 0;

  const date = localDateOf(slot.startsAt, org.timezone);
  const minute =
    Number(formatInTz(slot.startsAt, org.timezone, "H")) * 60 +
    Number(formatInTz(slot.startsAt, org.timezone, "m"));

  // Le créneau est-il déjà proposé (proposition en cours ou acceptée) ?
  const already = await tx
    .select({ entryId: waitlistOffer.entryId, status: waitlistOffer.status })
    .from(waitlistOffer)
    .where(
      and(
        eq(waitlistOffer.organizationId, org.id),
        eq(waitlistOffer.staffId, slot.staffId),
        eq(waitlistOffer.startsAt, slot.startsAt),
      ),
    );
  if (already.some((o) => o.status === "pending" || o.status === "accepted")) return 0;

  const entries = await tx
    .select()
    .from(waitlistEntry)
    .where(
      and(
        eq(waitlistEntry.organizationId, org.id),
        eq(waitlistEntry.status, "active"),
        lte(waitlistEntry.dateFrom, date),
        gte(waitlistEntry.dateTo, date),
      ),
    );
  if (!entries.length) return 0;

  // Prestations demandées réellement réalisables à cet horaire (horaires, pauses, absences, durée).
  const serviceIds = [...new Set(entries.map((e) => e.serviceId))];
  const services = await tx
    .select()
    .from(service)
    .where(
      and(
        eq(service.organizationId, org.id),
        inArray(service.id, serviceIds),
        eq(service.isActive, true),
      ),
    );
  const fits: Record<string, ServiceFit> = {};
  for (const svc of services) {
    if (svc.deletedAt) continue;
    const staffIds = (await staffForService(tx, org.id, svc.id)).map((s) => s.id);
    if (!staffIds.includes(slot.staffId)) continue;
    const input = await loadAvailabilityInput(tx, org, svc, [slot.staffId], date, date);
    if (isSlotAvailable(input, slot.startsAt, slot.staffId)) {
      fits[svc.id] = { blockMinutes: 0, staffIds: [slot.staffId] };
    }
  }

  const candidates: WaitlistCandidate[] = entries.map((e) => ({
    id: e.id,
    createdAt: e.createdAt,
    serviceId: e.serviceId,
    staffId: e.staffId,
    dateFrom: e.dateFrom,
    dateTo: e.dateTo,
    weekdays: e.weekdays,
    fromMinute: e.fromMinute,
    toMinute: e.toMinute,
  }));
  const chosen = matchWaitlist(
    candidates,
    { staffId: slot.staffId, date, weekday: isoWeekday(date), minute, freeMinutes: 24 * 60 },
    fits,
    { exclude: new Set(already.map((o) => o.entryId)) },
  );
  if (!chosen.length) return 0;

  await tx
    .insert(waitlistOffer)
    .values(
      chosen.map((e) => ({
        organizationId: org.id,
        entryId: e.id,
        staffId: slot.staffId,
        startsAt: slot.startsAt,
        expiresAt,
      })),
    )
    .onConflictDoNothing();
  await tx.insert(autopilotAction).values({
    organizationId: org.id,
    source: "waitlist",
    kind: "waitlist.offered",
    status: "done",
    summary: `Créneau du ${formatInTz(slot.startsAt, org.timezone, "EEE d MMM 'à' HH:mm")} proposé à ${chosen.length} client${chosen.length > 1 ? "s" : ""} de la liste d'attente`,
    payload: {
      staffId: slot.staffId,
      startsAt: slot.startsAt.toISOString(),
      offers: chosen.length,
    },
    decidedAt: now,
  });
  return chosen.length;
}
