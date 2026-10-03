import Link from "next/link";
import { Bookmark } from "lucide-react";

import { AdCard } from "@/components/ads/ad-card";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { requireAccount } from "@/lib/account";
import { NICHES, nicheLabel } from "@/lib/ads/catalog";
import { getAdContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Ad } from "@/types/database";

export const metadata = { title: "Favoris" };

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ niche?: string; q?: string }> }) {
  const account = await requireAccount("/app/favorites");
  const { niche, q } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_ads")
    .select("id, note, niche, created_at, ad:ads(*)")
    .eq("user_id", account.user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const all = (data ?? []).filter((s) => s.ad) as unknown as { id: string; note: string | null; niche: string | null; ad: Ad }[];
  const counts = new Map<string, number>();
  for (const s of all) {
    const n = s.niche ?? s.ad.niche ?? "none";
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  const needle = q?.trim().toLowerCase();
  const items = all.filter((s) => {
    if (niche && (s.niche ?? s.ad.niche ?? "none") !== niche) return false;
    if (needle && !`${s.ad.advertiser} ${s.ad.title} ${s.ad.body} ${s.note}`.toLowerCase().includes(needle)) return false;
    return true;
  });
  const { collections } = await getAdContext(account, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Favoris" description="Les publicités que tu as enregistrées, organisées par niche. Ouvre une publicité pour ajouter une note." />
      {all.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Aucun favori pour l'instant"
          description="Clique sur l'icône signet d'une publicité dans l'Ad Library pour la retrouver ici."
          action={<Button asChild variant="brand"><Link href="/app/library">Explorer l'Ad Library</Link></Button>}
        />
      ) : (
        <>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center" action="/app/favorites">
            {niche && <input type="hidden" name="niche" value={niche} />}
            <input name="q" defaultValue={q} placeholder="Rechercher dans mes favoris…" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm sm:max-w-xs" aria-label="Rechercher dans les favoris" />
            <nav className="flex flex-wrap gap-1.5" aria-label="Filtrer par niche">
              <Link href="/app/favorites" className={cn("rounded-full border px-2.5 py-1 text-xs", !niche ? "border-primary bg-primary/15" : "border-border text-muted-foreground")}>Toutes ({all.length})</Link>
              {[...counts.entries()].map(([n, c]) => (
                <Link key={n} href={`/app/favorites?niche=${n}`} className={cn("rounded-full border px-2.5 py-1 text-xs", niche === n ? "border-primary bg-primary/15" : "border-border text-muted-foreground")}>
                  {n === "none" ? "Non classées" : nicheLabel(n)} ({c})
                </Link>
              ))}
            </nav>
          </form>
          {items.length === 0 ? (
            <EmptyState icon={Bookmark} title="Aucun favori ne correspond" description="Modifie ta recherche ou le filtre de niche." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((s) => (
                <div key={s.id} className="flex flex-col gap-2">
                  <AdCard ad={s.ad} saved collections={collections} />
                  {s.note && <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">📝 {s.note}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <p className="sr-only">{NICHES.length} niches disponibles</p>
    </div>
  );
}
