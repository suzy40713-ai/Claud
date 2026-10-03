import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FolderOpen, Lock } from "lucide-react";

import { AdCard } from "@/components/ads/ad-card";
import { CollectionDialog, CollectionItemControls, DeleteCollectionButton } from "@/components/app/collection-forms";
import { EmptyState } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { requireAccount } from "@/lib/account";
import { nicheLabel } from "@/lib/ads/catalog";
import { getAdContext } from "@/lib/data";
import { hasFeature } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import type { Ad } from "@/types/database";

export const metadata = { title: "Collection" };

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await requireAccount(`/app/collections/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: collection } = await supabase.from("collections").select("*").eq("id", id).maybeSingle();
  if (!collection) notFound();
  const { data: items } = await supabase
    .from("collection_items")
    .select("id, note, ad:ads(*)")
    .eq("collection_id", id)
    .order("created_at", { ascending: false });
  const rows = (items ?? []).filter((i) => i.ad) as unknown as { id: string; note: string | null; ad: Ad }[];
  const { savedIds, collections } = await getAdContext(account, rows.map((r) => r.ad.id));
  const isOwner = collection.user_id === account.user.id;
  const canExport = hasFeature(account.plan.features, "exports");

  return (
    <div className="space-y-6">
      <Link href="/app/collections" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Collections
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {collection.description || "Aucune description."} · {collection.niche ? nicheLabel(collection.niche) : "Toutes niches"} · {rows.length} publicité{rows.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canExport ? (
            <>
              <Button asChild variant="outline" size="sm"><a href={`/api/export/collection/${id}?format=csv`}><Download /> CSV</a></Button>
              <Button asChild variant="outline" size="sm"><a href={`/api/export/collection/${id}?format=json`}><Download /> JSON</a></Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm"><Link href="/app/billing?plan=business"><Lock /> Exporter (Business)</Link></Button>
          )}
          {isOwner && <CollectionDialog mode="edit" collection={collection} />}
          {isOwner && <DeleteCollectionButton id={id} />}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Collection vide" description="Ajoute des publicités depuis l'Ad Library ou tes favoris grâce au bouton « Collection »." action={<Button asChild variant="brand"><Link href="/app/library">Explorer l'Ad Library</Link></Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="space-y-2">
              <AdCard ad={r.ad} saved={savedIds.has(r.ad.id)} collections={collections} />
              <CollectionItemControls collectionId={id} adId={r.ad.id} itemId={r.id} note={r.note} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
