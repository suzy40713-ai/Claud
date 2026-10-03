import { describe, expect, it } from "vitest";

import { classifyNiche } from "@/lib/ads/catalog";
import { searchDemo } from "@/lib/ads/sources/demo";
import { buildMetaParams, isMetaCountrySupported, normalizeMetaAd } from "@/lib/ads/sources/meta";
import { normalizeTikTokAd } from "@/lib/ads/sources/tiktok";

describe("Meta Ad Library", () => {
  it("only targets EU/EEA countries", () => {
    expect(isMetaCountrySupported("FR")).toBe(true);
    expect(isMetaCountrySupported("us")).toBe(false);
  });
  it("builds official API params", () => {
    const p = buildMetaParams({ q: "sérum", country: "FR", language: "fr", format: "video", dateFrom: "2026-01-01", advertiser: "123, abc, 456" }, 24, "TOKEN");
    expect(p.get("ad_type")).toBe("ALL");
    expect(p.get("ad_reached_countries")).toBe('["FR"]');
    expect(p.get("search_terms")).toBe("sérum");
    expect(p.get("media_type")).toBe("VIDEO");
    expect(p.get("languages")).toBe('["fr"]');
    expect(p.get("ad_delivery_date_min")).toBe("2026-01-01");
    expect(p.get("search_page_ids")).toBe('["123","456"]');
    expect(p.get("limit")).toBe("24");
    expect(p.get("fields")).not.toContain("spend");
  });
  it("uses the niche term when no keyword is given", () => {
    expect(buildMetaParams({ niche: "beaute", country: "FR", language: "fr" }, 10, "T").get("search_terms")).toBe("soin visage");
  });
  it("normalizes an archive record without inventing data", () => {
    const ad = normalizeMetaAd(
      { id: "42", page_name: "Brand", page_id: "7", ad_creative_bodies: ["Hello"], ad_delivery_start_time: "2026-09-01T10:00:00+0000", publisher_platforms: ["FACEBOOK", "INSTAGRAM"] },
      "fr"
    );
    expect(ad).toMatchObject({ source: "meta", source_ad_id: "42", advertiser: "Brand", body: "Hello", start_date: "2026-09-01", end_date: null, is_active: true, countries: ["FR"], platforms: ["facebook", "instagram"], media_urls: [] });
    expect(ad.source_url).toBe("https://www.facebook.com/ads/library/?id=42");
  });
});

describe("TikTok Commercial Content API", () => {
  it("normalizes video ads and dates", () => {
    const ad = normalizeTikTokAd(
      { ad: { id: 99, first_shown_date: 20260901, last_shown_date: 20260915, status: "inactive", videos: [{ url: "https://v/1.mp4", cover_image_url: "https://c/1.jpg" }] }, advertiser: { business_id: 5, business_name: "Shop" } },
      "FR"
    );
    expect(ad).toMatchObject({ source: "tiktok", source_ad_id: "99", media_type: "video", start_date: "2026-09-01", end_date: "2026-09-15", is_active: false, thumbnail_url: "https://c/1.jpg", advertiser: "Shop" });
  });
  it("skips records without id", () => expect(normalizeTikTokAd({}, "FR")).toBeNull());
});

describe("niche classification", () => {
  it("classifies from ad text", () => {
    expect(classifyNiche("Notre sérum à la vitamine C pour une peau éclatante")).toBe("beaute");
    expect(classifyNiche("Croquettes pour chien et chat")).toBe("animaux");
    expect(classifyNiche("")).toBeNull();
  });
});

describe("demo source", () => {
  it("flags every record as demo and paginates", () => {
    const page = searchDemo({ country: "FR" }, 5);
    expect(page.ads).toHaveLength(5);
    expect(page.ads.every((a) => a.is_demo && a.source === "demo")).toBe(true);
    expect(page.nextCursor).toBe("5");
  });
  it("filters by keyword and format", () => {
    const res = searchDemo({ country: "FR", q: "mascara", format: "video" }, 10);
    expect(res.ads.length).toBe(1);
  });
});
