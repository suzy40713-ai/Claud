import Link from "next/link";
import { History } from "lucide-react";

import { ClearHistoryButton } from "@/components/app/clear-history-button";
import { EmptyState, PageHeader, UpgradeGate } from "@/components/app/ui-bits";
import { requireAccount } from "@/lib/account";
import { countryLabel, nicheLabel } from "@/lib/ads/catalog";
import { hasFeature } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Historique des recherches" };

function toQuery(filters: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (k === "cache_key" || typeof v !== "string" || !v) continue;
    params.set(k, v);
  }
  return params.toString();
}

export default async function HistoryPage() {
  const account = await requireAccount("/app/history");
  if (!hasFeature(account.plan.features, "search_history")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Historique des recherches" />
        <UpgradeGate feature="L'historique des recherches" plan="Pro" description="Retrouve et relance en un clic toutes tes recherches passées." />
      </div>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase.from("searches").select("*").eq("user_id", account.user.id).order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Historique des recherches" description="Relance une recherche passée en un clic." actions={rows.length ? <ClearHistoryButton /> : undefined} />
      {rows.length === 0 ? (
        <EmptyState icon={History} title="Aucune recherche pour l'instant" description="Tes recherches dans l'Ad Library apparaîtront ici." />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {rows.map((s) => {
            const f = s.filters as Record<string, string>;
            return (
              <li key={s.id}>
                <Link href={`/app/library?${toQuery(f)}`} className="flex flex-col gap-1 p-4 hover:bg-card sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.query || (s.niche ? nicheLabel(s.niche) : "Recherche")}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.niche && nicheLabel(s.niche), f.country && countryLabel(f.country), f.language?.toUpperCase(), f.format, s.sources.join(" + ")].filter(Boolean).join(" · ")} · {s.results_count} résultat{s.results_count > 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelative(s.created_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
