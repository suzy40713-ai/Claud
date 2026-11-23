import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { aiGeneration, member } from "@/db/schema";
import type { ProductAnalysis } from "@/domain/marketing/analysis";
import type { AiClient } from "@/server/ai/gateway";
import { analyzeProduct, latestAnalysis } from "@/server/marketing/analysis";
import { createProduct, updateProduct } from "@/server/marketing/products";
import { ctxFor, makeOrg, makeUser } from "./factory";

afterAll(() => pg.end());

const input = {
  name: "Ebook « Lancer sa boutique »",
  description: "Un guide pas à pas pour ouvrir une boutique en ligne en 30 jours.",
  price: "19",
  category: "numerique" as const,
};

const ANALYSIS: ProductAnalysis = {
  summary: "Un guide pour débutants qui veulent ouvrir une boutique en ligne.",
  strengths: [{ text: "Promesse claire en 30 jours.", basis: "fourni" }],
  weaknesses: [{ text: "Public visé non précisé.", basis: "hypothese" }],
  audiences: [
    { name: "Salariés en reconversion", description: "…", motivation: "…", basis: "hypothese" },
  ],
  positioning: "Le guide le plus simple pour ouvrir sa boutique.",
  pricing: "19 € paraît cohérent pour un guide numérique.",
  angles: [{ title: "Simplicité", hook: "Ta boutique en 30 jours, sans jargon." }],
  channels: [{ channel: "TikTok", why: "Format tutoriel." }],
  objections: [{ objection: "Je trouve ça gratuit sur YouTube.", answer: "Tout est dans l'ordre." }],
  toVerify: ["Les lecteurs sont-ils prêts à payer 19 € ?"],
  firstActions: ["Écrire 3 posts", "Demander l'avis de 5 personnes", "Créer une page de vente"],
};

type Reply = { stop_reason?: string; parsed_output?: unknown; throws?: Error };

/** Faux client : aucun appel réseau, aucun coût. */
function fake(reply: Reply = {}) {
  const calls: unknown[] = [];
  const client: AiClient = {
    messages: {
      parse: (async (req: unknown) => {
        calls.push(req);
        if (reply.throws) throw reply.throws;
        return {
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-haiku-5-5",
          content: [],
          stop_reason: reply.stop_reason ?? "end_turn",
          usage: { input_tokens: 1200, output_tokens: 800 },
          parsed_output: "parsed_output" in reply ? reply.parsed_output : ANALYSIS,
        };
      }) as unknown as AiClient["messages"]["parse"],
    },
  };
  return { client, calls };
}

describe("copilote — analyse de produit (passerelle IA)", () => {
  it("analyse un produit, enregistre le coût réel et l'historique", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    const { client, calls } = fake();
    const r = await analyzeProduct(ctx, p.id, { client });
    expect(r.cached).toBe(false);
    expect(r.output.summary).toBe(ANALYSIS.summary);
    expect(calls).toHaveLength(1);
    const req = calls[0] as { model: string; messages: Array<{ content: string }> };
    expect(req.model).toBe("claude-haiku-5-5");
    // Aucun identifiant interne n'est envoyé au modèle.
    expect(req.messages[0].content).not.toContain(p.id);
    expect(req.messages[0].content).toContain("19.00 €");
    const [row] = await db.select().from(aiGeneration).where(eq(aiGeneration.id, r.id));
    // 1200 × 0,10 $ + 800 × 0,50 $ par million = 520 µ$
    expect(row).toMatchObject({ costMicroUsd: 520, inputTokens: 1200, cached: false });
    expect((await latestAnalysis(ctx, p.id))?.analysis.summary).toBe(ANALYSIS.summary);
  });

  it("réutilise gratuitement une analyse identique, relance après modification", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    const { client, calls } = fake();
    await analyzeProduct(ctx, p.id, { client });
    const again = await analyzeProduct(ctx, p.id, { client });
    expect(again.cached).toBe(true);
    expect(calls).toHaveLength(1);
    await updateProduct(ctx, p.id, { ...input, price: "24" });
    expect((await analyzeProduct(ctx, p.id, { client })).cached).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("bloque au-delà du quota mensuel du forfait (Free : 10)", async () => {
    const ctx = await makeOrg();
    const p = await createProduct(ctx, input);
    await db.insert(aiGeneration).values(
      Array.from({ length: 10 }, (_, i) => ({
        organizationId: ctx.organization.id,
        productId: p.id,
        kind: "test",
        model: "claude-haiku-5-5",
        inputHash: `h${i}`,
        input: {},
        output: {},
      })),
    );
    const { client, calls } = fake();
    await expect(analyzeProduct(ctx, p.id, { client })).rejects.toThrow(/10 générations IA/);
    expect(calls).toHaveLength(0);
  });

  it("respecte le plafond global de dépense du mois", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    const now = new Date("2099-03-15T12:00:00Z");
    await db.insert(aiGeneration).values({
      organizationId: ctx.organization.id,
      kind: "test",
      model: "claude-haiku-5-5",
      inputHash: "budget",
      input: {},
      output: {},
      costMicroUsd: 1_000_000_000,
      cached: false,
      createdAt: new Date("2099-03-02T00:00:00Z"),
    });
    const { client, calls } = fake();
    await expect(analyzeProduct(ctx, p.id, { client, now })).rejects.toThrow(/plafond mensuel/);
    expect(calls).toHaveLength(0);
    await db
      .delete(aiGeneration)
      .where(and(eq(aiGeneration.organizationId, ctx.organization.id), eq(aiGeneration.inputHash, "budget")));
  });

  it("n'affiche jamais une réponse refusée, tronquée ou invalide", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    await expect(
      analyzeProduct(ctx, p.id, { client: fake({ stop_reason: "refusal" }).client }),
    ).rejects.toThrow(/n'a pas pu être traitée/);
    await expect(
      analyzeProduct(ctx, p.id, { client: fake({ stop_reason: "max_tokens" }).client }),
    ).rejects.toThrow(/trop longue/);
    await expect(
      analyzeProduct(ctx, p.id, { client: fake({ parsed_output: null }).client }),
    ).rejects.toThrow(/incomplète/);
    await expect(
      analyzeProduct(ctx, p.id, { client: fake({ parsed_output: { summary: 1 } }).client }),
    ).rejects.toThrow(/incomplète/);
    await expect(
      analyzeProduct(ctx, p.id, { client: fake({ throws: new Error("réseau") }).client }),
    ).rejects.toThrow(/momentanément indisponible/);
    expect(await latestAnalysis(ctx, p.id)).toBeNull();
  });

  it("sans clé API : message clair, aucun appel", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    await expect(analyzeProduct(ctx, p.id, { client: null })).rejects.toThrow(/pas encore activées/);
  });

  it("isole les entreprises et refuse les employés", async () => {
    const a = await makeOrg({ plan: "starter" });
    const b = await makeOrg({ plan: "starter" });
    const p = await createProduct(a, input);
    const { client } = fake();
    await analyzeProduct(a, p.id, { client });
    await expect(analyzeProduct(b, p.id, { client })).rejects.toThrow(/introuvable/);
    expect(await latestAnalysis(b, p.id)).toBeNull();
    const u = await makeUser("Employé IA");
    await db.insert(member).values({ organizationId: a.organization.id, userId: u.id, role: "employee" });
    const employee = await ctxFor(u, a.organization.id);
    await expect(analyzeProduct(employee, p.id, { client })).rejects.toThrow();
  });
});
