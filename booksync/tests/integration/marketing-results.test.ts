import { afterAll, describe, expect, it } from "vitest";
import { sql as pg } from "@/db/client";
import { createProduct, deleteProduct } from "@/server/marketing/products";
import { addResult, deleteResult, listResults } from "@/server/marketing/results";
import { makeOrg } from "./factory";

afterAll(() => pg.end());

const now = new Date("2026-11-23T10:00:00Z");

describe("statistiques marketing (résultats déclarés)", () => {
  it("enregistre, liste par période et supprime", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    await addResult(ctx, { date: "2026-11-20", channel: "tiktok", spend: "10", sales: "1" }, now);
    await addResult(ctx, { date: "2026-09-01", channel: "email", sales: "2" }, now);
    expect(await listResults(ctx, 30, now)).toHaveLength(1);
    const all = await listResults(ctx, 90, now);
    expect(all).toHaveLength(2);
    await deleteResult(ctx, all[0].id);
    expect(await listResults(ctx, 90, now)).toHaveLength(1);
  });

  it("refuse une date future et un produit d'une autre entreprise", async () => {
    const a = await makeOrg({ plan: "starter" });
    const b = await makeOrg({ plan: "starter" });
    await expect(addResult(a, { date: "2026-12-01", channel: "tiktok", spend: "1" }, now)).rejects.toThrow(
      /Date invalide/,
    );
    const p = await createProduct(b, {
      name: "Produit B",
      description: "Une description suffisamment longue pour le test.",
      category: "autre",
    });
    await expect(
      addResult(a, { date: "2026-11-20", channel: "tiktok", spend: "1", productId: p.id }, now),
    ).rejects.toThrow(/introuvable/);
  });

  it("isole les entreprises ; la suppression du produit supprime ses résultats", async () => {
    const a = await makeOrg({ plan: "starter" });
    const b = await makeOrg({ plan: "starter" });
    const p = await createProduct(a, {
      name: "Produit A",
      description: "Une description suffisamment longue pour le test.",
      category: "autre",
    });
    const r = await addResult(a, { date: "2026-11-20", channel: "tiktok", spend: "1", productId: p.id }, now);
    expect(await listResults(b, 90, now)).toHaveLength(0);
    await expect(deleteResult(b, r.id)).rejects.toThrow(/introuvable/);
    await deleteProduct(a, p.id);
    expect(await listResults(a, 90, now)).toHaveLength(0);
  });
});
