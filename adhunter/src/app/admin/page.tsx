import { AlertTriangle, CreditCard, Search, Sparkles, Users, Wand2 } from "lucide-react";

import { HorizontalBars } from "@/components/app/trend-charts";
import { StatCard } from "@/components/app/ui-bits";
import { integrations, isDemoMode } from "@/lib/env";
import { currentPeriodStart } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const admin = createAdminClient();
  const since = currentPeriodStart().toISOString();
  const week = new Date(Date.now() - 7 * 86400_000).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [users, newUsers, pro, business, searches, analyses, creations, errors, ads] = await Promise.all([
    count(admin.from("profiles").select("id", { count: "exact", head: true })),
    count(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", week)),
    count(admin.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("plan", "pro").in("status", ["active", "trialing", "past_due"])),
    count(admin.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("plan", "business").in("status", ["active", "trialing", "past_due"])),
    count(admin.from("usage_events").select("id", { count: "exact", head: true }).eq("kind", "search").gte("created_at", since)),
    count(admin.from("usage_events").select("id", { count: "exact", head: true }).eq("kind", "analysis").gte("created_at", since)),
    count(admin.from("usage_events").select("id", { count: "exact", head: true }).eq("kind", "creation").gte("created_at", since)),
    count(admin.from("app_errors").select("id", { count: "exact", head: true }).eq("resolved", false)),
    count(admin.from("ads").select("id", { count: "exact", head: true })),
  ]);

  const integrationRows = [
    ["Supabase (service role)", integrations.supabaseAdmin()],
    ["Stripe", integrations.stripe()],
    ["IA (Anthropic)", integrations.ai()],
    ["Meta Ad Library API", integrations.meta()],
    ["TikTok Commercial Content API", integrations.tiktok()],
    ["Mode démo", isDemoMode()],
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Vue d'ensemble</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={users} hint={`+${newUsers} sur 7 jours`} icon={Users} href="/admin/users" />
        <StatCard label="Abonnés payants" value={pro + business} hint={`${pro} Pro · ${business} Business`} icon={CreditCard} href="/admin/subscriptions" />
        <StatCard label="Erreurs non résolues" value={errors} icon={AlertTriangle} href="/admin/errors" />
        <StatCard label="Publicités en base" value={ads} icon={Search} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Utilisation ce mois-ci</h2>
          <div className="mt-4">
            <HorizontalBars label="Événements" data={[{ name: "Recherches", value: searches }, { name: "Analyses IA", value: analyses }, { name: "Ad Creator", value: creations }]} />
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Search className="h-3 w-3" /> {searches}</span>
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {analyses}</span>
            <span className="inline-flex items-center gap-1"><Wand2 className="h-3 w-3" /> {creations}</span>
          </div>
        </section>
        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Intégrations</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {integrationRows.map(([label, ok]) => (
              <li key={label} className="flex items-center justify-between py-2">
                <span>{label}</span>
                <span className={ok ? "text-success" : "text-warning"}>{ok ? (label === "Mode démo" ? "Activé" : "Configuré") : label === "Mode démo" ? "Désactivé" : "Clé requise"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
