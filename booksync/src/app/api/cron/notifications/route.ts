import { connection } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/tokens";
import { ensureStripeSetup } from "@/server/billing/stripe";
import { processDueNotifications } from "@/server/notifications/dispatch";
import { processWaitlist } from "@/server/waitlist/service";

/**
 * Traitement planifié des notifications (rappels 24 h / 2 h, nouvelles tentatives).
 * Appelé toutes les 5 minutes par Supabase pg_cron (voir docs/deploiement.md), avec
 * l'en-tête Authorization: Bearer <CRON_SECRET>.
 */
async function handle(req: Request) {
  await connection();
  const expected = env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !safeEqual(given, expected))
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  const stats = await processDueNotifications();
  let waitlist: Awaited<ReturnType<typeof processWaitlist>> | "erreur";
  try {
    waitlist = await processWaitlist();
  } catch (error) {
    console.error("[liste d'attente] traitement planifié impossible", error);
    waitlist = "erreur";
  }
  // Configuration Stripe automatique (offres + webhook), sans bloquer les notifications.
  let billing: "ok" | "absent" | "erreur" = "absent";
  try {
    await ensureStripeSetup();
    if (process.env.STRIPE_SECRET_KEY) billing = "ok";
  } catch (error) {
    console.error("[stripe] configuration automatique impossible", error);
    billing = "erreur";
  }
  return Response.json(
    { ok: true, ...stats, waitlist, billing },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = handle;
export const POST = handle;
