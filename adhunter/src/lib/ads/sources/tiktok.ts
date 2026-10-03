import { NICHE_MAP } from "@/lib/ads/catalog";
import { SourceError, type NormalizedAd, type SearchFilters, type SourceResult } from "@/lib/ads/types";

/**
 * TikTok Commercial Content API (official "Ad Library" API):
 * https://developers.tiktok.com/doc/commercial-content-api-get-started
 *
 * Access must be requested and approved by TikTok (TIKTOK_CLIENT_KEY /
 * TIKTOK_CLIENT_SECRET). It covers ads shown in the EU/EEA. TikTok Creative
 * Center has no public API, so AdHunter does not scrape it.
 */

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const QUERY_URL = "https://open.tiktokapis.com/v2/research/adlib/ad/query/";
const FIELDS = "ad.id,ad.first_shown_date,ad.last_shown_date,ad.status,ad.videos,ad.image_urls,advertiser.business_id,advertiser.business_name";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const key = process.env.TIKTOK_CLIENT_KEY;
  const secret = process.env.TIKTOK_CLIENT_SECRET;
  if (!key || !secret) {
    throw new SourceError("TikTok credentials missing", "tiktok", "La source TikTok n'est pas encore configurée.");
  }
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: key, client_secret: secret, grant_type: "client_credentials" }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  const json = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !json.access_token) {
    throw new SourceError(
      `TikTok token error ${response.status}: ${json.error ?? "unknown"}`,
      "tiktok",
      "Impossible de s'authentifier auprès de TikTok. Vérifie que l'accès Commercial Content API est approuvé."
    );
  }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return json.access_token;
}

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function ymdToIso(value?: string | number | null) {
  if (!value) return null;
  const s = String(value);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

interface TikTokAdRecord {
  ad?: {
    id?: string | number;
    first_shown_date?: string | number;
    last_shown_date?: string | number;
    status?: string;
    videos?: { url?: string; cover_image_url?: string }[];
    image_urls?: string[];
  };
  advertiser?: { business_id?: string | number; business_name?: string };
}

export function normalizeTikTokAd(record: TikTokAdRecord, country: string): NormalizedAd | null {
  const ad = record.ad;
  if (!ad?.id) return null;
  const videos = (ad.videos ?? []).filter((v) => v.url);
  const images = ad.image_urls ?? [];
  const mediaType = videos.length ? "video" : images.length > 1 ? "carousel" : images.length ? "image" : "unknown";
  const id = String(ad.id);
  return {
    source: "tiktok",
    source_ad_id: id,
    advertiser: record.advertiser?.business_name ?? null,
    advertiser_id: record.advertiser?.business_id ? String(record.advertiser.business_id) : null,
    body: null,
    title: null,
    description: null,
    cta: null,
    media_type: mediaType,
    media_urls: videos.length ? videos.map((v) => v.url!) : images,
    thumbnail_url: videos[0]?.cover_image_url ?? images[0] ?? null,
    platforms: ["tiktok"],
    countries: [country.toUpperCase()],
    languages: [],
    start_date: ymdToIso(ad.first_shown_date),
    end_date: ymdToIso(ad.last_shown_date),
    is_active: ad.status ? ad.status.toLowerCase() === "active" : null,
    source_url: `https://library.tiktok.com/ads/detail/?ad_id=${encodeURIComponent(id)}`,
    is_demo: false,
  };
}

export async function searchTikTok(filters: SearchFilters, limit: number): Promise<SourceResult> {
  const token = await getAccessToken();
  const niche = filters.niche ? NICHE_MAP.get(filters.niche) : undefined;
  const searchTerm = filters.q?.trim() || (niche ? niche.terms[filters.language === "fr" ? "fr" : "en"] : "");

  const to = filters.dateTo ? new Date(filters.dateTo) : new Date();
  const from = filters.dateFrom ? new Date(filters.dateFrom) : new Date(to.getTime() - 90 * 86400_000);

  const body: Record<string, unknown> = {
    filters: {
      ad_published_date_range: { min: toYmd(from), max: toYmd(to) },
      country_code: filters.country.toUpperCase(),
      ...(filters.advertiser
        ? { advertiser_business_ids: filters.advertiser.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10) }
        : {}),
    },
    max_count: Math.min(limit, 50),
  };
  if (searchTerm) {
    body.search_term = searchTerm.slice(0, 50);
    body.search_type = "fuzzy_phrase";
  }
  if (filters.cursor) {
    const [searchId, offset] = filters.cursor.split(":");
    if (searchId) body.search_id = searchId;
    if (offset) body.offset = Number(offset);
  }

  let response: Response;
  try {
    response = await fetch(`${QUERY_URL}?fields=${FIELDS}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new SourceError(String(error), "tiktok", "TikTok ne répond pas. Réessaie dans un instant.");
  }

  const json = (await response.json().catch(() => ({}))) as {
    data?: { ads?: TikTokAdRecord[]; has_more?: boolean; search_id?: string };
    error?: { code?: string; message?: string };
  };
  if (!response.ok || (json.error?.code && json.error.code !== "ok")) {
    throw new SourceError(
      `TikTok API ${response.status}: ${json.error?.code} ${json.error?.message}`,
      "tiktok",
      response.status === 429
        ? "La limite de requêtes TikTok est atteinte. Réessaie plus tard."
        : "TikTok a refusé la requête. Essaie d'autres filtres."
    );
  }

  let ads = (json.data?.ads ?? []).map((r) => normalizeTikTokAd(r, filters.country)).filter((a): a is NormalizedAd => !!a);
  if (filters.format) ads = ads.filter((a) => a.media_type === filters.format);
  if (filters.status && filters.status !== "all") ads = ads.filter((a) => a.is_active === (filters.status === "active"));

  const offset = Number(filters.cursor?.split(":")[1] ?? 0) + (json.data?.ads?.length ?? 0);
  return {
    ads,
    nextCursor: json.data?.has_more && json.data.search_id ? `${json.data.search_id}:${offset}` : null,
  };
}
