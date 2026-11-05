import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, customer, organization, staff } from "@/db/schema";
import { verifyManageToken } from "@/lib/manage-token";
import { fileUrl } from "@/lib/files";

/** Rendez-vous accessible par le lien signé envoyé au client (aucun compte nécessaire). */
export async function getAppointmentByToken(token: string) {
  const id = verifyManageToken(token);
  if (!id) return null;
  const [row] = await db
    .select({ appt: appointment, cust: customer, org: organization, staffName: staff.displayName })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .where(eq(appointment.id, id))
    .limit(1);
  if (!row) return null;
  const deadline = new Date(row.appt.startsAt.getTime() - row.org.cancellationNoticeHours * 3_600_000);
  const canChange = row.appt.status === "confirmed" && new Date() < deadline && new Date() < row.appt.startsAt;
  return { ...row, canChange, deadline, logoUrl: fileUrl(row.org.logoFileId) };
}

/** Fichier iCalendar (.ics) pour ajouter le rendez-vous à son agenda. */
export function toIcs(a: { id: string; startsAt: Date; endsAt: Date; serviceName: string; status: string }, org: { name: string; addressLine1: string | null; postalCode: string | null; city: string | null }, staffName: string) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const location = [org.addressLine1, [org.postalCode, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookSync//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.id}@booksync`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(a.startsAt)}`,
    `DTEND:${fmt(a.endsAt)}`,
    `SUMMARY:${esc(`${a.serviceName} — ${org.name}`)}`,
    `DESCRIPTION:${esc(`Avec ${staffName}. Paiement sur place.`)}`,
    location ? `LOCATION:${esc(location)}` : null,
    `STATUS:${a.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
