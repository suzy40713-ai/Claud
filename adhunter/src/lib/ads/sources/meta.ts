import { EU_COUNTRIES, NICHE_MAP } from "@/lib/ads/catalog";
import { SourceError, type NormalizedAd, type SearchFilters, type SourceResult } from "@/lib/ads/types";

/**
 * Meta Ad Library API (official): https://www.facebook.com/ads/library/api
 *
 * Requirements: a Meta developer app, identity confirmation and an access
 * token with Ad Library API access (META_ACCESS_TOKEN). Commercial ads are
 * exposed for ads delivered in the EU/EEA (Digital Services Act); elsewhere
 * only political / social-issue ads are available, so AdHunter restricts
 * Meta searches to EU/EEA countries.
 *
 * The API does not return media files, spend, sales or conversion data, so
 * AdHunter never displays such numbers. Visuals are viewed through the
 * official Ad Library page linked from each ad.
 */

const FIELDS = [
  "id",
  "ad_creation_time",
  "ad_creative_bodies",
  "ad_creative_link_titles",
  "ad_creative_link_descriptions",
  "ad_creative_link_captions",
  "ad_delivery_start_time",
  "ad_delivery_stop_time",
  "languages",
  "page_id",
  "page_name",
  "publisher_platforms",
].join(",");

interface MetaAd {
  id: string;
  ad_creation_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_captions?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  languages?: string[];
  page_id?: string;
  page_name?: string;
  publisher_platforms?: string[];
}

interface MetaResponse {
  data?: MetaAd[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { message: string; code?: number; type?: string };
}

export function isMetaCountrySupported(country: string) {
  return EU_COUNTRIES.includes(country.toUpperCase());
}

const MEDIA_TYPE_PARAM: Record<string, string> = { image: "IMAGE", video: "VIDEO" };

export function buildMetaParams(filters: SearchFilters, limit: number, accessToken: string) {
  const language = filters.language || "fr";
  const niche = filters.niche ? NICHE_MAP.get(filters.niche) : undefined;
  const searchTerms = filters.q?.trim() || (niche ? niche.terms[language === "fr" ? "fr" : "en"] : "");

  const params = new URLSearchParams({
    access_token: accessToken,
    ad_type: "ALL",
    ad_reached_countries: JSON.stringify([filters.country.toUpperCase()]),
    ad_active_status: (filters.status ?? "all").toUpperCase(),
    fields: FIELDS,
    limit: String(limit),
  });
  if (searchTerms) {
    params.set("search_terms", searchTerms.slice(0, 100));
    params.set("search_type", "KEYWORD_UNORDERED");
  }
  if (filters.language) params.set("languages", JSON.stringify([filters.language]));
  if (filters.format && MEDIA_TYPE_PARAM[filters.format]) params.set("media_type", MEDIA_TYPE_PARAM[filters.format]);
  if (filters.dateFrom) params.set("ad_delivery_date_min", filters.dateFrom);
  if (filters.dateTo) params.set("ad_delivery_date_max", filters.dateTo);
  if (filters.advertiser) {
    const ids = filters.advertiser
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
      .slice(0, 10);
    if (ids.length) params.set("search_page_ids", JSON.stringify(ids));
  }
  if (filters.cursor) params.set("after", filters.cursor);
  return params;
}

function first(values?: string[]) {
  const v = values?.find((s) => s && s.trim());
  return v ? v.trim() : null;
}

function toDate(value?: string) {
  return value ? value.slice(0, 10) : null;
}

export function normalizeMetaAd(ad: MetaAd, country: string, requestedFormat?: string): NormalizedAd {
  const bodies = (ad.ad_creative_bodies ?? []).filter(Boolean);
  const titles = (ad.ad_creative_link_titles ?? []).filter(Boolean);
  // Several distinct creatives on one ad usually means a carousel / dynamic creative.
  const mediaType = requestedFormat === "image" || requestedFormat === "video"
    ? requestedFormat
    : titles.length > 1
      ? "carousel"
      : "unknown";
  return {
    source: "meta",
    source_ad_id: ad.id,
    advertiser: ad.page_name ?? null,
    advertiser_id: ad.page_id ?? null,
    body: first(bodies),
    title: first(titles),
    description: first(ad.ad_creative_link_descriptions),
    cta: first(ad.ad_creative_link_captions),
    media_type: mediaType,
    media_urls: [],
    thumbnail_url: null,
    platforms: (ad.publisher_platforms ?? []).map((p) => p.toLowerCase()),
    countries: [country.toUpperCase()],
    languages: ad.languages ?? [],
    start_date: toDate(ad.ad_delivery_start_time ?? ad.ad_creation_time),
    end_date: toDate(ad.ad_delivery_stop_time),
    is_active: ad.ad_delivery_stop_time ? false : true,
    source_url: `https://www.facebook.com/ads/library/?id=${encodeURIComponent(ad.id)}`,
    is_demo: false,
  };
}

export async function searchMeta(filters: SearchFilters, limit: number): Promise<SourceResult> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new SourceError("META_ACCESS_TOKEN missing", "meta", "La source Meta n'est pas encore configurée.");
  }
  if (!isMetaCountrySupported(filters.country)) {
    throw new SourceError(
      `Unsupported country ${filters.country}`,
      "meta",
      "Meta ne publie les publicités commerciales que pour les pays de l'UE/EEE. Choisis un pays européen."
    );
  }
  if (filters.format === "carousel") {
    // The Ad Library API has no carousel filter; we filter after normalization.
  }

  const version = process.env.META_GRAPH_VERSION || "v24.0";
  const url = `https://graph.facebook.com/${version}/ads_archive?${buildMetaParams(filters, limit, token)}`;

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  } catch (error) {
    throw new SourceError(String(error), "meta", "Meta Ad Library ne répond pas. Réessaie dans un instant.");
  }

  const json = (await response.json().catch(() => ({}))) as MetaResponse;
  if (!response.ok || json.error) {
    const code = json.error?.code;
    const userMessage =
      code === 190
        ? "Le jeton d'accès Meta a expiré. Un administrateur doit le renouveler."
        : code === 4 || code === 17 || code === 613
          ? "La limite de requêtes Meta est atteinte. Réessaie dans quelques minutes."
          : "Meta Ad Library a refusé la requête. Essaie d'autres filtres.";
    throw new SourceError(`Meta API ${response.status}: ${json.error?.message ?? "unknown"}`, "meta", userMessage);
  }

  let ads = (json.data ?? []).map((ad) => normalizeMetaAd(ad, filters.country, filters.format));
  if (filters.format === "carousel") ads = ads.filter((a) => a.media_type === "carousel");

  return {
    ads,
    nextCursor: json.paging?.next ? (json.paging.cursors?.after ?? null) : null,
  };
}
