import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import { consumeQuota, getFeatureFlags, refundQuota, type Account } from "@/lib/account";
import { classifyNiche } from "@/lib/ads/catalog";
import { searchDemo } from "@/lib/ads/sources/demo";
import { isMetaCountrySupported, searchMeta } from "@/lib/ads/sources/meta";
import { searchTikTok } from "@/lib/ads/sources/tiktok";
import { SourceError, type NormalizedAd, type SearchFilters, type SourceResult, type SourceStatus } from "@/lib/ads/types";
import { integrations, isDemoMode } from "@/lib/env";
import { logError } from "@/lib/errors";
import { hasFeature } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/server";
import type { Ad, AdSource } from "@/types/database";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // official libraries change slowly; caching keeps API usage low
const FREE_REPEAT_WINDOW_MS = 30 * 60 * 1000; // re-running the same search within 30 min is not charged

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined);

export const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  niche: z.string().max(40).optional().catch(undefined),
  platform: z.enum(["meta", "tiktok", "demo", "all"]).optional().catch("all"),
  country: z.string().length(2).toUpperCase().catch("FR"),
  language: z.string().max(5).optional().catch(undefined),
  format: z.enum(["image", "video", "carousel"]).optional().catch(undefined),
  dateFrom: dateSchema,
  dateTo: dateSchema,
  advertiser: z.string().max(200).optional().catch(undefined),
  status: z.enum(["active", "inactive", "all"]).optional().catch(undefined),
  cursor: z.string().max(500).optional().catch(undefined),
});

/** Parses URL search params into validated filters (unknown/invalid values are dropped). */
export function parseFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) {
    const value = Array.isArray(v) ? v[0] : v;
    flat[k] = value === "" ? undefined : value;
  }
  return filtersSchema.parse({ country: "FR", ...flat }) as SearchFilters;
}

export function hasSearchCriteria(f: SearchFilters) {
  return Boolean(f.q || f.niche || f.advertiser);
}

export async function getSourceStatuses(): Promise<SourceStatus[]> {
  const flags = await getFeatureFlags();
  const statuses: SourceStatus[] = [
    {
      id: "meta",
      label: "Meta Ad Library",
      available: integrations.meta() && flags.source_meta !== false,
      reason: !integrations.meta()
        ? "En préparation — jeton Meta Ad Library API requis"
        : flags.source_meta === false
          ? "Temporairement désactivée"
          : undefined,
    },
    {
      id: "tiktok",
      label: "TikTok Commercial Content API",
      available: integrations.tiktok() && flags.source_tiktok !== false,
      reason: !integrations.tiktok()
        ? "En préparation — accès TikTok Commercial Content API requis"
        : flags.source_tiktok === false
          ? "Temporairement désactivée"
          : undefined,
    },
  ];
  if (isDemoMode()) statuses.push({ id: "demo", label: "Données de démonstration", available: true });
  return statuses;
}

type Cursor = Partial<Record<AdSource, string>>;

function encodeCursor(c: Cursor) {
  return Object.keys(c).length ? Buffer.from(JSON.stringify(c)).toString("base64url") : null;
}

function decodeCursor(value?: string): Cursor {
  if (!value) return {};
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return typeof parsed === "object" && parsed ? (parsed as Cursor) : {};
  } catch {
    return {};
  }
}

export interface SearchOutcome {
  ads: Ad[];
  nextCursor: string | null;
  warnings: string[];
  sources: AdSource[];
  cached: boolean;
}

function stableKey(account: Account, filters: SearchFilters, sources: AdSource[], limit: number) {
  const payload = JSON.stringify({
    f: Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined).sort()),
    s: [...sources].sort(),
    l: limit,
    // advanced filters are plan dependent, so the plan is part of the key
    p: account.planId,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Runs a search across the selected official sources. Server-side checks:
 * auth (caller), plan-gated advanced filters, monthly quota, feature flags.
 */
export async function runSearch(account: Account, rawFilters: SearchFilters): Promise<SearchOutcome> {
  const filters: SearchFilters = { ...rawFilters };
  // Advanced search is a Business feature: silently drop those filters otherwise.
  if (!hasFeature(account.plan.features, "advanced_search")) {
    delete filters.advertiser;
    delete filters.status;
  }

  const statuses = await getSourceStatuses();
  const available = statuses.filter((s) => s.available).map((s) => s.id);
  const requested: AdSource[] =
    !filters.platform || filters.platform === "all" ? available : available.filter((s) => s === filters.platform);

  const warnings: string[] = [];
  if (requested.includes("meta") && !isMetaCountrySupported(filters.country)) {
    warnings.push("Meta ne publie les publicités commerciales que pour l'UE/EEE : la source Meta a été ignorée pour ce pays.");
  }
  const sources = requested.filter((s) => s !== "meta" || isMetaCountrySupported(filters.country));
  if (!sources.length) {
    return { ads: [], nextCursor: null, warnings, sources: [], cached: false };
  }

  const limit = Math.max(1, Math.min(50, account.plan.limits.results_per_search));
  const cacheKey = stableKey(account, filters, sources, limit);
  const admin = createAdminClient();

  // One quota unit per new search: further result pages are free, and so is
  // re-running the exact same search shortly after (refresh, back button…).
  const isFirstPage = !filters.cursor;
  let charge = false;
  if (isFirstPage) {
    const { data: recent } = await admin
      .from("searches")
      .select("id")
      .eq("user_id", account.user.id)
      .eq("filters->>cache_key", cacheKey)
      .gte("created_at", new Date(Date.now() - FREE_REPEAT_WINDOW_MS).toISOString())
      .limit(1);
    charge = !recent?.length;
  }
  if (charge) await consumeQuota(account, "search");

  try {
    // 1. Shared cache (results of official APIs are public data).
    const { data: cachedRow } = await admin.from("search_cache").select("*").eq("cache_key", cacheKey).maybeSingle();
    if (cachedRow && Date.now() - new Date(cachedRow.created_at).getTime() < CACHE_TTL_MS) {
      const ads = await loadAdsInOrder(cachedRow.ad_ids);
      await recordSearch(account, filters, sources, ads.length, cacheKey, charge && isFirstPage);
      return { ads, nextCursor: cachedRow.next_cursor, warnings, sources, cached: true };
    }

    // 2. Live query, sources in parallel.
    const cursor = decodeCursor(filters.cursor);
    const perSource = Math.ceil(limit / sources.length);
    const results = await Promise.allSettled(
      sources.map(async (source): Promise<[AdSource, SourceResult]> => {
        // A source whose pagination is exhausted is skipped on later pages.
        if (filters.cursor && !cursor[source]) return [source, { ads: [], nextCursor: null }];
        const f = { ...filters, cursor: cursor[source] };
        if (source === "meta") return [source, await searchMeta(f, perSource)];
        if (source === "tiktok") return [source, await searchTikTok(f, perSource)];
        return [source, searchDemo(f, perSource)];
      })
    );

    const collected: NormalizedAd[] = [];
    const nextCursor: Cursor = {};
    let failures = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        const [source, res] = r.value;
        collected.push(...res.ads);
        if (res.nextCursor) nextCursor[source] = res.nextCursor;
      } else {
        failures += 1;
        const err = r.reason;
        if (err instanceof SourceError) {
          warnings.push(err.userMessage);
          await logError(`source:${err.source}`, err, account.user.id);
        } else {
          warnings.push("Une source n'a pas pu être interrogée.");
          await logError("search", err, account.user.id);
        }
      }
    }

    if (failures === sources.length) {
      if (charge) await refundQuota(account, "search");
      return { ads: [], nextCursor: null, warnings, sources, cached: false };
    }

    const ads = await upsertAds(collected);
    const encoded = encodeCursor(nextCursor);
    if (failures === 0) {
      await admin
        .from("search_cache")
        .upsert({ cache_key: cacheKey, ad_ids: ads.map((a) => a.id), next_cursor: encoded, created_at: new Date().toISOString() });
    }
    await recordSearch(account, filters, sources, ads.length, cacheKey, charge && isFirstPage);
    return { ads, nextCursor: encoded, warnings, sources, cached: false };
  } catch (error) {
    if (charge) await refundQuota(account, "search");
    throw error;
  }
}

async function recordSearch(
  account: Account,
  filters: SearchFilters,
  sources: AdSource[],
  count: number,
  cacheKey: string,
  shouldRecord: boolean
) {
  if (!shouldRecord) return;
  const { cursor: _cursor, ...rest } = filters;
  void _cursor;
  await createAdminClient()
    .from("searches")
    .insert({
      user_id: account.user.id,
      query: filters.q ?? null,
      niche: filters.niche ?? null,
      filters: { ...rest, cache_key: cacheKey },
      sources,
      results_count: count,
    });
}

async function loadAdsInOrder(ids: string[]): Promise<Ad[]> {
  if (!ids.length) return [];
  const { data } = await createAdminClient().from("ads").select("*").in("id", ids);
  const byId = new Map((data ?? []).map((a) => [a.id, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is Ad => !!a);
}

/** Upserts normalized ads into the shared `ads` table and returns the stored rows (input order). */
export async function upsertAds(ads: NormalizedAd[]): Promise<Ad[]> {
  if (!ads.length) return [];
  const now = new Date().toISOString();
  const rows = ads.map((ad) => ({
    ...ad,
    niche: classifyNiche([ad.title, ad.body, ad.description, ad.advertiser].filter(Boolean).join(" ")),
    last_seen_at: now,
  }));
  // Deduplicate within the batch (same ad from several pages/sources).
  const unique = [...new Map(rows.map((r) => [`${r.source}:${r.source_ad_id}`, r])).values()];
  const { data, error } = await createAdminClient()
    .from("ads")
    .upsert(unique, { onConflict: "source,source_ad_id" })
    .select("*");
  if (error) throw error;
  const byKey = new Map((data ?? []).map((a) => [`${a.source}:${a.source_ad_id}`, a]));
  return unique.map((r) => byKey.get(`${r.source}:${r.source_ad_id}`)).filter((a): a is Ad => !!a);
}
