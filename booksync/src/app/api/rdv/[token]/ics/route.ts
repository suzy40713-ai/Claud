import { connection } from "next/server";
import { getAppointmentByToken, toIcs } from "@/server/booking/manage";

export async function GET(_req: Request, { params }: RouteContext<"/api/rdv/[token]/ics">) {
  await connection();
  const { token } = await params;
  const data = await getAppointmentByToken(token);
  if (!data) return new Response("Introuvable", { status: 404 });
  return new Response(toIcs(data.appt, data.org, data.staffName), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rendez-vous-${data.org.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
