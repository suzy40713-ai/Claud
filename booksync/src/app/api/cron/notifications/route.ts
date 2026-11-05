import { connection } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/tokens";
import { processDueNotifications } from "@/server/notifications/dispatch";

/**
 * Traitement planifié des notifications (rappels 24 h / 2 h, nouvelles tentatives).
 * Appelé toutes les 5 minutes par Supabase pg_cron (voir docs/deploiement.md), avec
 * l'en-tête Authorization: Bearer <CRON_SECRET>.
 */
async function handle(req: Request) {
  await connection();
  const expected = env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !safeEqual(given, expected)) return Response.json({ error: "Non autorisé" }, { status: 401 });
  const stats = await processDueNotifications();
  return Response.json({ ok: true, ...stats }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
