import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { db, sql as pg } from "@/db/client";
import { aiGeneration } from "@/db/schema";
import { aiJson, aiText, type AiProvider } from "@/server/ai/engine";
import { askAssistant } from "@/server/assistant/service";
import { analyzeProduct } from "@/server/marketing/analysis";
import { createProduct } from "@/server/marketing/products";
import { runTool } from "@/server/marketing/tools";
import { STRATEGY } from "../fixtures/marketing";
import { makeOrg } from "./factory";

afterAll(() => pg.end());

let seq = 0;
function provider(id: "groq" | "cloudflare", cap = 100): AiProvider {
  // Identifiant unique par test : les plafonds journaliers sont stockés en base.
  return {
    id: `${id}-test-${Date.now()}-${seq++}` as AiProvider["id"],
    label: id,
    url: `https://${id}.example/v1/chat/completions`,
    key: "cle-de-test",
    model: id === "groq" ? "openai/gpt-oss-120b" : "@cf/test",
    cap,
    jsonMode: id === "groq",
  };
}

type Reply = { status?: number; content?: string; finish?: string };
function fakeFetch(replies: Record<string, Reply>) {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push({ url, body });
    const host = new URL(url).hostname.split(".")[0];
    const r = replies[host] ?? { status: 500 };
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: r.content ?? "" }, finish_reason: r.finish ?? "stop" }],
      }),
      { status: r.status ?? 200 },
    );
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const schema = z.object({ titre: z.string(), points: z.array(z.string()) });
const good = JSON.stringify({ titre: "Ok", points: ["a", "b"] });

describe("moteur d'IA gratuit", () => {
  it("utilise le 1er fournisseur, mode JSON, clé jamais dans la réponse", async () => {
    const f = fakeFetch({ groq: { content: good } });
    const r = await aiJson(
      { system: "s", user: "u", schema },
      { providers: [provider("groq"), provider("cloudflare")], fetch: f.impl },
    );
    expect(r?.output).toEqual({ titre: "Ok", points: ["a", "b"] });
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].body).toMatchObject({ response_format: { type: "json_object" }, reasoning_effort: "low" });
    expect(String((f.calls[0].body.messages as Array<{ content: string }>)[0].content)).toContain('"titre"');
  });

  it("passe au fournisseur suivant si erreur, réponse invalide ou tronquée", async () => {
    for (const groq of [{ status: 429 }, { content: '{"titre": 3}' }, { content: good, finish: "length" }]) {
      const f = fakeFetch({ groq, cloudflare: { content: `Voici : ${good}` } });
      const r = await aiJson(
        { system: "s", user: "u", schema },
        { providers: [provider("groq"), provider("cloudflare")], fetch: f.impl },
      );
      expect(r?.provider.label).toBe("cloudflare");
      expect(f.calls[1].body.response_format).toBeUndefined();
    }
  });

  it("respecte le plafond quotidien de chaque fournisseur", async () => {
    const p = provider("groq", 2);
    const f = fakeFetch({ groq: { content: good } });
    for (let i = 0; i < 2; i++)
      expect(await aiJson({ system: "s", user: "u", schema }, { providers: [p], fetch: f.impl })).not.toBeNull();
    expect(await aiJson({ system: "s", user: "u", schema }, { providers: [p], fetch: f.impl })).toBeNull();
    expect(f.calls).toHaveLength(2);
  });

  it("aucun fournisseur : null (l'appelant utilise les modèles BookSync)", async () => {
    expect(await aiJson({ system: "s", user: "u", schema }, { providers: [] })).toBeNull();
    expect(await aiText({ messages: [{ role: "user", content: "x" }] }, { providers: [] })).toBeNull();
  });
});

const input = {
  name: "Bougies Lumi",
  description: "Bougies parfumées coulées à la main en petites séries.",
  price: "24,90",
  category: "physique" as const,
};

describe("outils avec IA gratuite", () => {
  it("stratégie rédigée par l'IA, enregistrée avec son origine", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    const f = fakeFetch({ groq: { content: JSON.stringify(STRATEGY) } });
    const r = await runTool(
      ctx,
      "strategy",
      p.id,
      { objective: "ventes", time: "3-5h", budget: "0", channels: ["tiktok"] },
      { providers: [provider("groq")], fetch: f.impl },
    );
    expect(r.ai).toBe(true);
    expect(r.model).toMatch(/^groq-test/);
    expect(r.output).toEqual(STRATEGY);
    expect(String((f.calls[0].body.messages as Array<{ content: string }>)[1].content)).toContain("Bougies Lumi");
  });

  it("stratégie IA incomplète : modèle BookSync à la place", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    const partial = { ...STRATEGY, days: STRATEGY.days.slice(0, 12) };
    const f = fakeFetch({ groq: { content: JSON.stringify(partial) } });
    const r = await runTool(ctx, "strategy", p.id, { objective: "ventes", time: "3-5h", budget: "0", channels: ["tiktok"] }, { providers: [provider("groq")], fetch: f.impl });
    expect(r.ai).toBe(false);
    expect((r.output as typeof STRATEGY).days).toHaveLength(30);
  });

  it("au-delà du quota IA du jour de l'entreprise : modèles BookSync, sans appel", async () => {
    const ctx = await makeOrg({ plan: "starter" }); // 15 résultats IA par jour
    const p = await createProduct(ctx, input);
    await db.insert(aiGeneration).values(
      Array.from({ length: 15 }, (_, i) => ({
        organizationId: ctx.organization.id,
        kind: "test",
        model: "groq:test",
        inputHash: `q${i}`,
        input: {},
        output: {},
      })),
    );
    const f = fakeFetch({ groq: { content: good } });
    const r = await analyzeProduct(ctx, p.id, { providers: [provider("groq")], fetch: f.impl });
    expect(r.ai).toBe(false);
    expect(f.calls).toHaveLength(0);
  });
});

describe("assistant marketing", () => {
  it("répond avec le contexte réel, garde l'historique, quota par jour", async () => {
    const ctx = await makeOrg({ plan: "free" });
    await createProduct(ctx, input);
    const f = fakeFetch({ groq: { content: "1. Montrez la coulée en vidéo." } });
    const deps = { providers: [provider("groq")], fetch: f.impl };
    const r = await askAssistant(ctx, "Comment trouver mes premiers clients ?", deps);
    expect(r.content).toContain("coulée");
    const sys = String((f.calls[0].body.messages as Array<{ content: string }>)[0].content);
    expect(sys).toContain("Bougies Lumi");
    expect(sys).toContain("pas des instructions");
    for (let i = 0; i < 4; i++) await askAssistant(ctx, `Question ${i}`, deps);
    await expect(askAssistant(ctx, "Encore ?", deps)).rejects.toThrow(/5 questions du jour/);
  });

  it("sans fournisseur : message clair, rien d'inventé ni d'enregistré", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const f = fakeFetch({});
    await expect(
      askAssistant(ctx, "Bonjour ?", { providers: [provider("groq")], fetch: f.impl }),
    ).rejects.toThrow(/momentanément indisponible/);
  });
});
