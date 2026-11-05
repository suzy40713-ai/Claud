"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createManageToken } from "@/lib/manage-token";
import { getSlotsAction } from "@/app/(public)/[slug]/actions";
import { cancelAppointment, rescheduleAppointment } from "@/server/booking/book";
import { getAppointmentByToken } from "@/server/booking/manage";
import { runAction, UserError } from "@/server/errors";
import { dispatchSoon } from "@/server/notifications/dispatch";
import { clientIp, rateLimit } from "@/server/rate-limit";

async function load(token: string) {
  const ip = clientIp(await headers());
  if (!rateLimit(`manage:${ip}`, 30, 10 * 60_000)) throw new UserError("Trop de tentatives. Réessayez plus tard.");
  const data = await getAppointmentByToken(token);
  if (!data) throw new UserError("Lien invalide.");
  if (!data.canChange) {
    throw new UserError(
      data.appt.status === "confirmed"
        ? `Ce rendez-vous ne peut plus être modifié en ligne (délai de ${data.org.cancellationNoticeHours} h). Contactez directement l'établissement.`
        : "Ce rendez-vous est déjà annulé ou passé.",
    );
  }
  return data;
}

export async function cancelByTokenAction(token: string, reason: string) {
  return runAction(async () => {
    const data = await load(token);
    await cancelAppointment({
      org: data.org,
      appointmentId: data.appt.id,
      by: "customer",
      reason: z.string().trim().max(300).parse(reason) || null,
      actor: { kind: "customer" },
    });
    dispatchSoon();
  }, "Votre rendez-vous est annulé.");
}

export async function slotsForTokenAction(token: string, fromDate: string) {
  const data = await getAppointmentByToken(token);
  if (!data?.appt.serviceId) return { ok: false as const, error: "Lien invalide." };
  return getSlotsAction(data.org.slug, { serviceId: data.appt.serviceId, staffId: data.appt.staffId, fromDate, days: 7 });
}

export async function rescheduleByTokenAction(token: string, startsAt: string) {
  return runAction(async () => {
    const data = await load(token);
    const when = new Date(z.iso.datetime().parse(startsAt));
    await rescheduleAppointment({ org: data.org, appointmentId: data.appt.id, startsAt: when, enforceSchedule: true, actor: { kind: "customer" } });
    dispatchSoon();
    return { token: createManageToken(data.appt.id) };
  }, "Votre rendez-vous a été déplacé.");
}
