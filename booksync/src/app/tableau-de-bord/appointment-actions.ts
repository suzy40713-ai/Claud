"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/server/auth/session";
import {
  cancelByStaff,
  createManualAppointment,
  listAppointmentsInRange,
  listTimeOffInRange,
  rescheduleByStaff,
  setAttendance,
  updateInternalNote,
} from "@/server/appointments";
import { runAction } from "@/server/errors";
import { searchCustomers } from "@/server/customers/service";

function refresh<T>(res: T): T {
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

const rangeSchema = z.object({ from: z.iso.datetime(), to: z.iso.datetime(), staffIds: z.array(z.uuid()).max(50).optional() });

export async function listRangeAction(input: z.input<typeof rangeSchema>) {
  const ctx = await requireOrg();
  return runAction(async () => {
    const { from, to, staffIds } = rangeSchema.parse(input);
    const f = new Date(from);
    const t = new Date(to);
    if (t.getTime() - f.getTime() > 45 * 86_400_000) throw new Error("Période trop longue");
    const [appointments, absences] = await Promise.all([listAppointmentsInRange(ctx, f, t, staffIds), listTimeOffInRange(ctx, f, t)]);
    return {
      appointments: appointments.map((a) => ({ ...a, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), createdAt: a.createdAt.toISOString() })),
      absences: absences.map((a) => ({ ...a, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString() })),
    };
  });
}

export async function createAppointmentAction(input: Parameters<typeof createManualAppointment>[1]) {
  const ctx = await requireOrg();
  return refresh(await runAction(async () => ({ id: (await createManualAppointment(ctx, input)).id }), "Rendez-vous créé."));
}

export async function rescheduleAppointmentAction(id: string, input: { startsAt: string; staffId?: string | null }) {
  const ctx = await requireOrg();
  return refresh(await runAction(async () => void (await rescheduleByStaff(ctx, id, input)), "Rendez-vous déplacé."));
}

export async function cancelAppointmentAction(id: string, reason?: string) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => cancelByStaff(ctx, id, reason), "Rendez-vous annulé."));
}

export async function setAttendanceAction(id: string, status: "completed" | "no_show" | "confirmed") {
  const ctx = await requireOrg();
  return refresh(await runAction(() => setAttendance(ctx, id, status), "Statut mis à jour."));
}

export async function updateNoteAction(id: string, note: string) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => updateInternalNote(ctx, id, note), "Note enregistrée."));
}

export async function searchCustomersAction(q: string) {
  const ctx = await requireOrg();
  if (q.trim().length < 2) return [];
  return searchCustomers(ctx, q);
}
