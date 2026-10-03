import "server-only";

import { NICHES, nicheLabel } from "@/lib/ads/catalog";
import { isDemoMode } from "@/lib/env";
import { extractKeywords, topCounts } from "@/lib/keywords";
import { createAdminClient } from "@/lib/supabase/server";

export const MIN_SAMPLE = 15;

export interface TrendData {
  periodDays: number;
  sample: { searches: number; ads: number };
  sufficient: boolean;
  includesDemo: boolean;
  topNiches: { niche: string; label: string; searches: number; ads: number }[];
  searchKeywords: { key: string; count: number }[];
  adKeywords: { key: string; count: number }[];
  formats: { key: string; count: number }[];
  platforms: { key: string; count: number }[];
  weekly: { week: string; searches: number; ads: number; [niche: string]: number | string }[];
  weeklyNiches: string[];
  ideas: { title: string; description: string; basedOn: string }[];
}

function weekStart(dateIso: string) {
  const d = new Date(dateIso);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregates real activity collected by AdHunter (anonymous aggregates across
 * all users' searches + public ads observed through official APIs). No
 * personal data is exposed and nothing is extrapolated: figures are counts
 * inside AdHunter's own dataset, shown with their sample size.
 */
export async function computeTrends(periodDays = 30): Promise<TrendData> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - periodDays * 86400_000).toISOString();
  const includesDemo = isDemoMode();

  let adsQuery = admin
    .from("ads")
    .select("niche, media_type, platforms, body, title, first_seen_at, is_demo")
    .gte("last_seen_at", since)
    .order("last_seen_at", { ascending: false })
    .limit(5000);
  if (!includesDemo) adsQuery = adsQuery.eq("is_demo", false);

  const [{ data: searches }, { data: ads }] = await Promise.all([
    admin.from("searches").select("query, niche, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
    adsQuery,
  ]);

  const s = searches ?? [];
  const a = ads ?? [];

  const nicheSearch = topCounts(s.map((x) => x.niche).filter((n): n is string => !!n), 20);
  const nicheAds = topCounts(a.map((x) => x.niche).filter((n): n is string => !!n), 20);
  const nicheIds = new Set([...nicheSearch.map((n) => n.key), ...nicheAds.map((n) => n.key)]);
  const topNiches = [...nicheIds]
    .map((id) => ({
      niche: id,
      label: nicheLabel(id),
      searches: nicheSearch.find((n) => n.key === id)?.count ?? 0,
      ads: nicheAds.find((n) => n.key === id)?.count ?? 0,
    }))
    .sort((x, y) => y.searches + y.ads - (x.searches + x.ads))
    .slice(0, 8);

  const searchKeywords = topCounts(s.flatMap((x) => extractKeywords(x.query)), 15);
  const adKeywords = topCounts(a.flatMap((x) => extractKeywords(`${x.title ?? ""} ${x.body ?? ""}`)), 20);
  const formats = topCounts(a.map((x) => x.media_type).filter((m) => m !== "unknown"), 5);
  const platforms = topCounts(a.flatMap((x) => x.platforms), 8);

  const weeklyNiches = topNiches.slice(0, 3).map((n) => n.niche);
  const weeks = new Map<string, { week: string; searches: number; ads: number; [k: string]: number | string }>();
  const bucket = (iso: string) => {
    const w = weekStart(iso);
    if (!weeks.has(w)) weeks.set(w, { week: w, searches: 0, ads: 0, ...Object.fromEntries(weeklyNiches.map((n) => [n, 0])) });
    return weeks.get(w)!;
  };
  for (const x of s) {
    const b = bucket(x.created_at);
    b.searches += 1;
    if (x.niche && weeklyNiches.includes(x.niche)) (b[x.niche] as number) += 1;
  }
  for (const x of a) bucket(x.first_seen_at).ads += 1;
  const weekly = [...weeks.values()].sort((x, y) => x.week.localeCompare(y.week));

  const sufficient = s.length + a.length >= MIN_SAMPLE;

  const ideas: TrendData["ideas"] = [];
  if (sufficient) {
    const topFormat = formats[0]?.key;
    for (const n of topNiches.slice(0, 3)) {
      const kw = adKeywords.find((k) => NICHES.find((ni) => ni.id === n.niche)?.keywords.some((nk) => k.key.includes(nk.trim())))?.key
        ?? adKeywords[0]?.key;
      ideas.push({
        title: `Tester un angle « ${kw ?? n.label.toLowerCase()} » en ${n.label}`,
        description: `Cette niche revient souvent dans les données récentes d'AdHunter. Analyse 3 à 5 publicités de la niche, relève leurs accroches, puis teste une variante ${topFormat === "video" ? "vidéo courte" : topFormat === "carousel" ? "carrousel" : "image"} avec ton propre angle.`,
        basedOn: `${n.searches} recherche(s) et ${n.ads} publicité(s) observée(s) sur ${periodDays} jours`,
      });
    }
  }

  return {
    periodDays,
    sample: { searches: s.length, ads: a.length },
    sufficient,
    includesDemo,
    topNiches,
    searchKeywords,
    adKeywords,
    formats,
    platforms,
    weekly,
    weeklyNiches,
    ideas,
  };
}
