import Link from "next/link";
import { FolderOpen, Users } from "lucide-react";

import { CollectionDialog } from "@/components/app/collection-forms";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { requireAccount } from "@/lib/account";
import { nicheLabel } from "@/lib/ads/catalog";
import { hasFeature } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const account = await requireAccount("/app/collections");
  const supabase = await createClient();
  const [{ data: collections }, { data: teams }] = await Promise.all([
    supabase.from("collections").select("*, items:collection_items(count)").order("updated_at", { ascending: false }),
    hasFeature(account.plan.features, "teams") ? supabase.from("teams").select("id, name") : Promise.resolve({ data: [] }),
  ]);
  const list = collections ?? [];
  const own = list.filter((c) => c.user_id === account.user.id).length;
  const max = account.plan.limits.collections_max;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description={max < 0 ? "Organise tes publicités par client, produit ou niche." : `Organise tes publicités. Ta formule inclut ${max} collection${max > 1 ? "s" : ""} (${own} utilisée${own > 1 ? "s" : ""}).`}
        actions={<CollectionDialog mode="create" teams={teams ?? []} />}
      />
      {list.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Aucune collection" description="Crée ta première collection, puis ajoute-y des publicités depuis l'Ad Library avec l'icône dossier." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const count = (c.items as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link key={c.id} href={`/app/collections/${c.id}`} className="surface card-hover block p-5">
                <div className="flex items-start justify-between gap-2">
                  <FolderOpen className="h-5 w-5 text-violet-400" />
                  {c.team_id && <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"><Users className="h-3 w-3" /> Équipe</span>}
                </div>
                <h2 className="mt-3 truncate font-medium">{c.name}</h2>
                {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                <p className="mt-3 text-xs text-muted-foreground">
                  {count} publicité{count > 1 ? "s" : ""} · {c.niche ? nicheLabel(c.niche) : "Toutes niches"} · {formatRelative(c.updated_at)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
