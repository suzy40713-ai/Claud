import { after, connection } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/tokens";
import { runBlogAgent } from "@/server/blog/agent";

/**
 * Agent SEO : appelé toutes les 2 heures par Supabase pg_cron (en-tête Authorization: Bearer <CRON_SECRET>).
 * Répond tout de suite ; l'article est rédigé après la réponse (l'appel pg_net n'attend que 5 s).
 * L'agent publie au plus 3 articles par jour, espacés d'au moins 7 heures.
 */
async function handle(req: Request) {
  await connection();
  const expected = env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !safeEqual(given, expected))
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  after(async () => {
    try {
      const r = await runBlogAgent();
      console.info("[blog] agent SEO", JSON.stringify(r));
    } catch (error) {
      console.error("[blog] agent SEO en échec", error);
    }
  });
  return Response.json({ ok: true, started: true }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
