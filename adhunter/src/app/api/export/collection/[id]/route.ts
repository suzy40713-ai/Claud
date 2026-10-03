import { NextResponse } from "next/server";

import { assertFeature, consumeQuota, getAccount } from "@/lib/account";
import { nicheLabel } from "@/lib/ads/catalog";
import { toCsv } from "@/lib/csv";
import { UserFacingError, logError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Ad } from "@/types/database";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAccount();
  if (!account) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";

  try {
    assertFeature(account, "exports");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new UserFacingError("Collection introuvable.");
    const supabase = await createClient();
    // RLS: only collections the user owns or shares through a team are readable.
    const { data: collection } = await supabase.from("collections").select("*").eq("id", id).maybeSingle();
    if (!collection) throw new UserFacingError("Collection introuvable.");
    await consumeQuota(account, "export");

    const { data: items } = await supabase.from("collection_items").select("note, created_at, ad:ads(*)").eq("collection_id", id).order("created_at");
    const rows = (items ?? []).filter((i) => i.ad) as unknown as { note: string | null; created_at: string; ad: Ad }[];
    const safeName = collection.name.replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 50) || "collection";
    const date = new Date().toISOString().slice(0, 10);

    if (format === "json") {
      const body = {
        collection: { name: collection.name, description: collection.description, niche: collection.niche, exported_at: new Date().toISOString() },
        disclaimer: "Données issues de bibliothèques publicitaires publiques. Aucune donnée de performance (budget, ventes, conversions) n'est incluse.",
        ads: rows.map((r) => ({
          advertiser: r.ad.advertiser,
          source: r.ad.source,
          title: r.ad.title,
          body: r.ad.body,
          platforms: r.ad.platforms,
          format: r.ad.media_type,
          niche: r.ad.niche,
          countries: r.ad.countries,
          start_date: r.ad.start_date,
          end_date: r.ad.end_date,
          source_url: r.ad.source_url,
          is_demo: r.ad.is_demo,
          note: r.note,
          added_at: r.created_at,
        })),
      };
      return new NextResponse(JSON.stringify(body, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="adhunter-${safeName}-${date}.json"` },
      });
    }

    const csv = toCsv(
      ["Annonceur", "Source", "Titre", "Texte", "Plateformes", "Format", "Niche", "Pays", "Début", "Fin", "Lien source", "Démo", "Note", "Ajoutée le"],
      rows.map((r) => [
        r.ad.advertiser, r.ad.source, r.ad.title, r.ad.body, r.ad.platforms, r.ad.media_type, nicheLabel(r.ad.niche), r.ad.countries,
        r.ad.start_date, r.ad.end_date, r.ad.source_url, r.ad.is_demo ? "oui" : "non", r.note, r.created_at.slice(0, 10),
      ])
    );
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="adhunter-${safeName}-${date}.csv"` },
    });
  } catch (error) {
    if (error instanceof UserFacingError) {
      const status = error.code === "plan_required" || error.code === "quota_exceeded" ? 403 : 400;
      return new NextResponse(error.message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    await logError("export:collection", error, account.user.id);
    return new NextResponse("L'export a échoué. Réessaie plus tard.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
