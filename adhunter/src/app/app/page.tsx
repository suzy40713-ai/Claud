import Link from "next/link";
import { ArrowRight, BarChart3, Bookmark, Eye, FolderOpen, History, Library, Lock, Sparkles, Wand2 } from "lucide-react";

import { DemoBadge, EmptyState, PageHeader, StatCard, UsageBar } from "@/components/app/ui-bits";
import { InfoTip } from "@/components/shared/info-tip";
import { FormMessage } from "@/components/shared/form-message";
import { getUsage, requireAccount } from "@/lib/account";
import { NICHE_MAP, nicheLabel } from "@/lib/ads/catalog";
import { hasFeature } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { computeTrends } from "@/lib/trends";
import { formatRelative, truncate } from "@/lib/utils";

export const metadata = { title: "Tableau de bord" };

type AdLite = { id: string; advertiser: string | null; title: string | null; body: string | null; niche: string | null; is_demo: boolean };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const account = await requireAccount("/app");
  const sp = await searchParams;
  const supabase = await createClient();
  const uid = account.user.id;
  const proHistory = hasFeature(account.plan.features, "search_history");
  const proTrends = hasFeature(account.plan.features, "trend_radar");

  const [usage, savedCount, collectionsCount, { data: views }, { data: favorites }, { data: searches }, trends] = await Promise.all([
    getUsage(account),
    supabase.from("saved_ads").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("collections").select("id", { count: "exact", head: true }),
    supabase.from("ad_views").select("viewed_at, ad:ads(id, advertiser, title, body, niche, is_demo)").eq("user_id", uid).order("viewed_at", { ascending: false }).limit(5),
    supabase.from("saved_ads").select("created_at, ad:ads(id, advertiser, title, body, niche, is_demo)").eq("user_id", uid).order("created_at", { ascending: false }).limit(4),
    supabase.from("searches").select("id, query, niche, filters, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
    proTrends ? computeTrends(30).catch(() => null) : Promise.resolve(null),
  ]);

  const firstName = account.profile.full_name?.split(" ")[0];
  const preferred = account.profile.preferred_niches.filter((n) => NICHE_MAP.has(n));
  const latestFavorite = (favorites ?? [])[0]?.ad as unknown as AdLite | undefined;

  const suggestions: { href: string; title: string; text: string }[] = [];
  for (const n of preferred.slice(0, 2)) {
    suggestions.push({ href: `/app/library?niche=${n}`, title: `Explorer la niche ${nicheLabel(n)}`, text: "Découvre les publicités récentes de ta niche préférée." });
  }
  if (latestFavorite) {
    suggestions.push({ href: `/app/ads/${latestFavorite.id}#analyse`, title: `Analyser « ${truncate(latestFavorite.advertiser ?? "ton dernier favori", 30)} »`, text: "Comprends pourquoi cette publicité a retenu ton attention." });
  }
  if ((savedCount.count ?? 0) >= 3 && (collectionsCount.count ?? 0) === 0) {
    suggestions.push({ href: "/app/collections", title: "Organiser tes favoris", text: "Crée une collection pour regrouper tes inspirations par projet." });
  }
  if (hasFeature(account.plan.features, "ad_creator")) {
    suggestions.push({ href: "/app/creator", title: "Créer ta prochaine publicité", text: "Transforme tes découvertes en accroches et textes originaux." });
  }
  if (!suggestions.length) {
    suggestions.push({ href: "/app/library", title: "Lancer une première recherche", text: "Choisis une niche ou un mot-clé pour commencer ta veille." });
  }

  const shortcuts = [
    { href: "/app/library", label: "Ad Library", icon: Library },
    { href: "/app/analyzer", label: "AI Analyzer", icon: Sparkles },
    { href: "/app/creator", label: "Ad Creator", icon: Wand2, locked: !hasFeature(account.plan.features, "ad_creator") },
    { href: "/app/trends", label: "Trend Radar", icon: BarChart3, locked: !proTrends },
  ];

  return (
    <div className="space-y-8">
      {sp.password === "updated" && <FormMessage type="success">Ton mot de passe a bien été mis à jour.</FormMessage>}
      <PageHeader title={firstName ? `Bonjour ${firstName} 👋` : "Tableau de bord"} description="Ta veille publicitaire en un coup d'œil." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Publicités enregistrées" value={savedCount.count ?? 0} icon={Bookmark} href="/app/favorites" />
        <StatCard label="Collections" value={collectionsCount.count ?? 0} icon={FolderOpen} href="/app/collections" />
        <StatCard label="Recherches ce mois" value={usage.counts.search} icon={Library} hint={usage.limits.search < 0 ? "Illimité" : `sur ${usage.limits.search}`} />
        <StatCard label="Analyses IA ce mois" value={usage.counts.analysis} icon={Sparkles} hint={usage.limits.analysis < 0 ? "Illimité" : `sur ${usage.limits.analysis}`} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className="surface card-hover flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-violet-400"><s.icon className="h-4 w-4" /></span>
            <span className="flex-1 text-sm font-medium">{s.label}</span>
            {s.locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-violet-400" /> Suggestions pour toi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {suggestions.slice(0, 4).map((s) => (
              <Link key={s.href + s.title} href={s.href} className="rounded-lg border border-border bg-background/40 p-4 transition-colors hover:border-primary/40">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.text}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="surface space-y-4 p-5">
          <h2 className="flex items-center justify-between text-sm font-semibold">
            Utilisation — formule {account.plan.name}
            <Link href="/app/billing" className="text-xs font-normal text-violet-400 hover:underline">Gérer</Link>
          </h2>
          <UsageBar label="Recherches" used={usage.counts.search} limit={usage.limits.search} />
          <UsageBar label="Analyses IA" used={usage.counts.analysis} limit={usage.limits.analysis} />
          <UsageBar label="Ad Creator" used={usage.counts.creation} limit={usage.limits.creation} />
          <p className="text-xs text-muted-foreground">Quotas réinitialisés le 1er de chaque mois.</p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdList title="Récemment consultées" icon={Eye} items={(views ?? []).map((v) => ({ ad: v.ad as unknown as AdLite | null, date: v.viewed_at }))} empty="Les publicités que tu ouvres apparaîtront ici." />
        <AdList title="Favoris récents" icon={Bookmark} href="/app/favorites" items={(favorites ?? []).map((v) => ({ ad: v.ad as unknown as AdLite | null, date: v.created_at }))} empty="Enregistre une publicité pour la retrouver ici." />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-violet-400" /> Tendances détectées
            <InfoTip>Basées sur les recherches et publicités réellement collectées par AdHunter sur 30 jours.</InfoTip>
          </h2>
          {!proTrends ? (
            <p className="mt-4 text-sm text-muted-foreground"><Lock className="mr-1 inline h-3.5 w-3.5" />Le Trend Radar est inclus dans Pro et Business. <Link href="/app/billing?plan=pro" className="text-violet-400 hover:underline">Découvrir</Link></p>
          ) : !trends?.sufficient ? (
            <p className="mt-4 text-sm text-muted-foreground">Pas encore assez de données pour dégager des tendances fiables ({trends?.sample.searches ?? 0} recherches, {trends?.sample.ads ?? 0} publicités sur 30 jours).</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {trends.topNiches.slice(0, 4).map((n) => (
                <li key={n.niche} className="flex items-center justify-between text-sm">
                  <Link href={`/app/library?niche=${n.niche}`} className="hover:text-violet-400">{n.label}</Link>
                  <span className="font-mono text-xs text-muted-foreground">{n.searches} rech. · {n.ads} pub.</span>
                </li>
              ))}
              <li><Link href="/app/trends" className="text-xs text-violet-400 hover:underline">Ouvrir le Trend Radar →</Link></li>
            </ul>
          )}
        </section>
        <section className="surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4 text-violet-400" /> Historique des recherches</h2>
          {!proHistory ? (
            <p className="mt-4 text-sm text-muted-foreground"><Lock className="mr-1 inline h-3.5 w-3.5" />L'historique complet est inclus dans Pro et Business.</p>
          ) : (searches ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucune recherche pour l'instant.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {(searches ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/app/library?${new URLSearchParams(Object.entries(s.filters as Record<string, string>).filter(([k, v]) => k !== "cache_key" && typeof v === "string")).toString()}`} className="truncate hover:text-violet-400">
                    {s.query || nicheLabel(s.niche)}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(s.created_at)}</span>
                </li>
              ))}
              <li><Link href="/app/history" className="text-xs text-violet-400 hover:underline">Tout l'historique →</Link></li>
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function AdList({ title, icon: Icon, items, empty, href }: { title: string; icon: typeof Eye; items: { ad: AdLite | null; date: string }[]; empty: string; href?: string }) {
  const rows = items.filter((i) => i.ad);
  return (
    <section className="surface p-5">
      <h2 className="flex items-center justify-between text-sm font-semibold">
        <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-violet-400" /> {title}</span>
        {href && <Link href={href} className="text-xs font-normal text-violet-400 hover:underline">Tout voir</Link>}
      </h2>
      {rows.length === 0 ? (
        <EmptyState icon={Icon} title="Rien pour l'instant" description={empty} className="mt-4 py-8" />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rows.map(({ ad, date }) => (
            <li key={ad!.id}>
              <Link href={`/app/ads/${ad!.id}`} className="flex items-center gap-3 py-2.5 hover:text-violet-400">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm">{ad!.advertiser ?? "Annonceur"} {ad!.is_demo && <DemoBadge />}</p>
                  <p className="truncate text-xs text-muted-foreground">{truncate(ad!.title || ad!.body, 90) || nicheLabel(ad!.niche)}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
