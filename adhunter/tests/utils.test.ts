import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "@/lib/csv";
import { extractKeywords, topCounts } from "@/lib/keywords";
import { safeRedirectPath } from "@/lib/utils";
import { analysisSchema, creatorInputSchema } from "@/lib/ai/schemas";

describe("safeRedirectPath", () => {
  it("blocks open redirects", () => {
    expect(safeRedirectPath("/app/billing?plan=pro")).toBe("/app/billing?plan=pro");
    expect(safeRedirectPath("https://evil.com")).toBe("/app");
    expect(safeRedirectPath("//evil.com")).toBe("/app");
    expect(safeRedirectPath("/\\evil.com")).toBe("/app");
    expect(safeRedirectPath(null)).toBe("/app");
  });
});

describe("CSV export", () => {
  it("escapes quotes, separators and formula injection", () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(["x", "y"])).toBe("x | y");
    expect(toCsv(["h"], [[1]]).startsWith("﻿")).toBe(true);
  });
});

describe("keywords", () => {
  it("drops stopwords and short tokens", () => {
    const kws = extractKeywords("Découvre notre nouvelle crème pour la peau, livraison offerte ! https://x.y");
    expect(kws).toContain("crème");
    expect(kws).toContain("peau");
    expect(kws).not.toContain("pour");
    expect(kws).not.toContain("livraison");
  });
  it("ranks counts", () => expect(topCounts(["a", "b", "a"], 1)).toEqual([{ key: "a", count: 2 }]));
});

describe("AI input validation", () => {
  it("rejects incomplete creator input", () => {
    expect(creatorInputSchema.safeParse({ productName: "X" }).success).toBe(false);
    expect(
      creatorInputSchema.safeParse({ productName: "Gourde", description: "Une gourde isotherme qui garde au frais 24h.", audience: "sportifs", platform: "tiktok", tone: "amical", goal: "ventes" }).success
    ).toBe(true);
  });
  it("analysis schema requires all sections", () => {
    expect(analysisSchema.safeParse({ summary: "x" }).success).toBe(false);
  });
});
