import type { AdSource, MediaType } from "@/types/database";

export interface SearchFilters {
  q?: string;
  niche?: string;
  platform?: "meta" | "tiktok" | "demo" | "all";
  country: string;
  language?: string;
  format?: "image" | "video" | "carousel";
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  // Business-only advanced filters
  advertiser?: string; // Meta page id(s) / TikTok business id, comma separated
  status?: "active" | "inactive" | "all";
  cursor?: string;
}

/** Normalized ad, as returned by a source before it is persisted in `ads`. */
export interface NormalizedAd {
  source: AdSource;
  source_ad_id: string;
  advertiser: string | null;
  advertiser_id: string | null;
  body: string | null;
  title: string | null;
  description: string | null;
  cta: string | null;
  media_type: MediaType;
  media_urls: string[];
  thumbnail_url: string | null;
  platforms: string[];
  countries: string[];
  languages: string[];
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  source_url: string | null;
  is_demo: boolean;
}

export interface SourceResult {
  ads: NormalizedAd[];
  nextCursor: string | null;
}

export interface SourceStatus {
  id: AdSource;
  label: string;
  available: boolean;
  reason?: string;
}

export class SourceError extends Error {
  constructor(
    message: string,
    public readonly source: AdSource,
    public readonly userMessage: string
  ) {
    super(message);
    this.name = "SourceError";
  }
}
