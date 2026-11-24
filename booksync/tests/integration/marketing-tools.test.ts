import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { aiGeneration, member } from "@/db/schema";
import type { ToolKind } from "@/domain/marketing/tools";
import { analyzeProduct, latestAnalysis } from "@/server/marketing/analysis";
import { createProduct } from "@/server/marketing/products";
import { getToolResult, runTool, toolHistory } from "@/server/marketing/tools";
import { ctxFor, makeOrg, makeUser } from "./factory";

afterAll(() => pg.end());

const input = {
  name: "Bougies Lumi",
  description: "Bougies parfumées coulées à la main en petites séries, cire végétale.",
  price: "24,90",
  category: "physique" as const,
  benefits: "Cire végétale\nParfum qui dure\nFabriquées en France",
  targetAudience: "Les amoureux de déco cosy",
};

const CASES: Array<[ToolKind, Record<string, unknown>]> = [
  ["strategy", { objective: "ventes", time: "3-5h", budget: "50", channels: ["tiktok", "email"] }],
  ["ad", { platform: "google", style: "demo", offer: "Livraison offerte dès 30 €" }],
  ["content", { platform: "tiktok", format: "carousel", goal: "confiance" }],
  ["sales", { problem: "pas-de-ventes", pageText: "Bougie Lumi. Ajouter au panier." }],
];

describe("copilote gratuit (sans IA)", () => {
  it("analyse un produit gratuitement, sans limite, coût 0", async () => {
    const ctx = await makeOrg();
    const p = await createProduct(ctx, input);
    for (let i = 0; i < 12; i++) await analyzeProduct(ctx, p.id); // au-delà de l'ancien quota Free
    const r = await analyzeProduct(ctx, p.id);
    expect(r.output.strengths[0].text).toContain("cire végétale");
    const [row] = await db.select().from(aiGeneration).where(eq(aiGeneration.id, r.id));
    expect(row).toMatchObject({ costMicroUsd: 0, model: "modele-gratuit" });
    expect((await latestAnalysis(ctx, p.id))?.analysis.summary).toContain("Bougies Lumi");
  });

  it.each(CASES)("%s : produit, enregistré et relu", async (kind, options) => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    const r = await runTool(ctx, kind, p.id, options);
    const read = await getToolResult(ctx, kind, r.id);
    expect(read?.output).toEqual(r.output);
    expect(read?.input.choix).toBeDefined();
    expect((await toolHistory(ctx, kind)).map((h) => h.id)).toContain(r.id);
    expect(await getToolResult(ctx, kind === "ad" ? "content" : "ad", r.id)).toBeNull();
  });

  it("une nouvelle version propose d'autres idées", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    const opts = { platform: "tiktok", format: "video", goal: "vendre" };
    const a = (await runTool(ctx, "content", p.id, opts)).output as { pieces: Array<{ title: string }> };
    const b = (await runTool(ctx, "content", p.id, opts)).output as { pieces: Array<{ title: string }> };
    expect(a.pieces[0].title).not.toBe(b.pieces[0].title);
  });

  it("refuse des choix invalides", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    await expect(runTool(ctx, "ad", p.id, { platform: "snapchat", style: "demo" })).rejects.toThrow();
  });

  it("isole les entreprises et refuse les employés", async () => {
    const a = await makeOrg({ plan: "starter" });
    const b = await makeOrg({ plan: "starter" });
    const p = await createProduct(a, input);
    const r = await runTool(a, "content", p.id, CASES[2][1]);
    expect(await getToolResult(b, "content", r.id)).toBeNull();
    await expect(runTool(b, "content", p.id, CASES[2][1])).rejects.toThrow(/produits/);
    await expect(analyzeProduct(b, p.id)).rejects.toThrow(/introuvable/);
    const u = await makeUser("Employé outils");
    await db.insert(member).values({ organizationId: a.organization.id, userId: u.id, role: "employee" });
    const employee = await ctxFor(u, a.organization.id);
    await expect(getToolResult(employee, "content", r.id)).rejects.toThrow();
  });
});
