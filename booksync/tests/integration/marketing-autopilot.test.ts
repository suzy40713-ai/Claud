import { afterAll, describe, expect, it } from "vitest";
import { db, sql as pg } from "@/db/client";
import { aiGeneration } from "@/db/schema";
import { assistantContext } from "@/server/assistant/service";
import { addTask, getActivePlan, setTaskDone, startPlan, stopPlan } from "@/server/marketing/autopilot";
import { createProduct, deleteProduct } from "@/server/marketing/products";
import { STRATEGY } from "../fixtures/marketing";
import { makeOrg } from "./factory";
import type { OrgContext } from "@/server/auth/session";

afterAll(() => pg.end());

async function setup(ctx: OrgContext) {
  const p = await createProduct(ctx, {
    name: "Bougies Lumi",
    description: "Bougies parfumées coulées à la main en petites séries.",
    price: "24,90",
    category: "physique",
  });
  const [g] = await db
    .insert(aiGeneration)
    .values({
      organizationId: ctx.organization.id,
      productId: p.id,
      kind: "strategy",
      model: "claude-haiku-5-5",
      inputHash: `t-${p.id}`,
      input: {},
      output: STRATEGY,
    })
    .returning();
  return { p, strategyId: g.id };
}

describe("Autopilot marketing", () => {
  it("lance 30 jours × 3 actions, coche, suit la progression", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const { strategyId } = await setup(ctx);
    const start = new Date("2026-11-02T09:00:00Z");
    await startPlan(ctx, strategyId, start);
    let a = (await getActivePlan(ctx, start))!;
    expect(a.day).toBe(1);
    expect(a.tasks).toHaveLength(90);
    expect(a.today.map((t) => t.title)[0]).toBe("Filmer la coulée 1");
    await setTaskDone(ctx, a.today[0].id, true);
    // Trois jours plus tard : les actions non faites des jours 1 à 3 sont en retard.
    a = (await getActivePlan(ctx, new Date("2026-11-05T09:00:00Z")))!;
    expect(a.day).toBe(4);
    expect(a.progress).toMatchObject({ done: 1, total: 90, late: 8 });
    await setTaskDone(ctx, a.late[0].id, false);
    expect((await getActivePlan(ctx, start))!.progress.done).toBe(1);
    expect((await getActivePlan(ctx, new Date("2026-12-10T09:00:00Z")))!.progress.finished).toBe(true);
  });

  it("un seul Autopilot actif ; arrêt ; suppression du produit", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const { p, strategyId } = await setup(ctx);
    const first = await startPlan(ctx, strategyId);
    const second = await startPlan(ctx, strategyId);
    expect((await getActivePlan(ctx))!.plan.id).toBe(second.id);
    expect(second.id).not.toBe(first.id);
    await stopPlan(ctx);
    expect(await getActivePlan(ctx)).toBeNull();
    await startPlan(ctx, strategyId);
    await deleteProduct(ctx, p.id);
    expect(await getActivePlan(ctx)).toBeNull();
  });

  it("ajoute des actions libres au jour courant, seulement avec un plan actif", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const { strategyId } = await setup(ctx);
    await expect(addTask(ctx, { title: "Écrire à 5 clients" })).rejects.toThrow(/Lancez d'abord/);
    await startPlan(ctx, strategyId);
    await addTask(ctx, { title: "Écrire à 5 clients" });
    await addTask(ctx, { title: "Afficher le prix", detail: "Issu de l'optimisation des ventes." });
    const a = (await getActivePlan(ctx))!;
    expect(a.today.map((t) => t.title).slice(-2)).toEqual(["Écrire à 5 clients", "Afficher le prix"]);
    expect(a.progress.total).toBe(92);
    await expect(addTask(ctx, { title: "x" })).rejects.toThrow();
  });

  it("isole les entreprises", async () => {
    const a = await makeOrg({ plan: "starter" });
    const b = await makeOrg({ plan: "starter" });
    const { strategyId } = await setup(a);
    await expect(startPlan(b, strategyId)).rejects.toThrow(/introuvable/);
    await startPlan(a, strategyId);
    const task = (await getActivePlan(a))!.today[0];
    await expect(setTaskDone(b, task.id, true)).rejects.toThrow(/introuvable/);
    expect(await getActivePlan(b)).toBeNull();
  });

  it("l'assistant reçoit les produits et l'Autopilot (sans données inventées)", async () => {
    const ctx = await makeOrg({ plan: "pro" });
    const { strategyId } = await setup(ctx);
    await startPlan(ctx, strategyId);
    expect(await assistantContext(ctx)).toMatchObject({
      produits: [{ nom: "Bougies Lumi", prix_euros: 24.9, analyse: null }],
      autopilot: { produit: "Bougies Lumi", jour: 1, actions_faites: 0, actions_total: 90 },
      resultats_du_mois: { ventes_declarees: 0, chiffre_affaires_declare_euros: 0 },
    });
  });
});
