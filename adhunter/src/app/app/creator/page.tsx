import Link from "next/link";
import { Wand2 } from "lucide-react";

import { CreatorForm } from "@/components/ai/creator-form";
import { DemoBadge, EmptyState, NotConfigured, PageHeader, UpgradeGate, UsageBar } from "@/components/app/ui-bits";
import { getUsage, requireAccount } from "@/lib/account";
import { integrations, isDemoMode } from "@/lib/env";
import { hasFeature } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Ad Creator" };

export default async function CreatorPage() {
  const account = await requireAccount("/app/creator");
  if (!hasFeature(account.plan.features, "ad_creator")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ad Creator" description="Génère des accroches, textes, CTA et concepts vidéo originaux pour ton produit." />
        <UpgradeGate feature="Ad Creator" plan="Pro" description="Décris ton produit et obtiens 5 accroches, 3 textes, 3 CTA, 3 concepts vidéo et des variantes TikTok, Instagram et Facebook." />
      </div>
    );
  }
  const supabase = await createClient();
  const [usage, { data: creations }] = await Promise.all([
    getUsage(account),
    supabase.from("ai_creations").select("id, title, is_demo, created_at").eq("user_id", account.user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const aiReady = integrations.ai() || isDemoMode();

  return (
    <div className="space-y-8">
      <PageHeader title="Ad Creator" description="Décris ton produit : l'IA rédige des contenus publicitaires originaux, prêts à tester." />
      {!aiReady && (
        <NotConfigured title="Ad Creator en préparation">La clé du service d'IA n'est pas encore configurée sur cette instance.</NotConfigured>
      )}
      <div className="max-w-sm">
        <UsageBar label="Générations ce mois-ci" used={usage.counts.creation} limit={usage.limits.creation} />
      </div>
      <CreatorForm disabled={!aiReady} />
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Mes créations enregistrées</h2>
        {(creations ?? []).length === 0 ? (
          <EmptyState icon={Wand2} title="Aucune création pour l'instant" description="Chaque campagne générée est enregistrée automatiquement ici. Tu pourras la rouvrir, la modifier et la copier." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(creations ?? []).map((c) => (
              <li key={c.id}>
                <Link href={`/app/creator/${c.id}`} className="surface card-hover block p-4">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">{c.title} {c.is_demo && <DemoBadge />}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelative(c.created_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
