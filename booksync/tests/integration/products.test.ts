import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { member, organization } from "@/db/schema";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  setBookingModule,
  updateProduct,
} from "@/server/marketing/products";
import { ctxFor, makeOrg, makeUser } from "./factory";

afterAll(() => pg.end());

const input = {
  name: "Ebook « Lancer sa boutique »",
  description: "Un guide pas à pas pour ouvrir une boutique en ligne en 30 jours.",
  price: "19",
  category: "numerique" as const,
};

describe("copilote marketing — produits", () => {
  it("crée, modifie, liste et supprime un produit", async () => {
    const ctx = await makeOrg({ plan: "starter" });
    const p = await createProduct(ctx, input);
    expect(p).toMatchObject({ priceCents: 1900, category: "numerique" });
    await updateProduct(ctx, p.id, { ...input, price: "", name: "Ebook v2" });
    expect(await getProduct(ctx, p.id)).toMatchObject({ name: "Ebook v2", priceCents: null });
    expect((await listProducts(ctx)).map((x) => x.id)).toEqual([p.id]);
    await deleteProduct(ctx, p.id);
    expect(await getProduct(ctx, p.id)).toBeNull();
  });

  it("respecte la limite du forfait Free (1 produit)", async () => {
    const ctx = await makeOrg();
    await createProduct(ctx, input);
    await expect(createProduct(ctx, input)).rejects.toThrow(/limité à 1 produit/);
  });

  it("isole les produits entre entreprises", async () => {
    const a = await makeOrg({ plan: "starter" });
    const b = await makeOrg({ plan: "starter" });
    const p = await createProduct(a, input);
    expect(await getProduct(b, p.id)).toBeNull();
    await expect(updateProduct(b, p.id, input)).rejects.toThrow(/introuvable/);
    await expect(deleteProduct(b, p.id)).rejects.toThrow(/introuvable/);
    expect(await listProducts(b)).toHaveLength(0);
  });

  it("un employé n'a pas accès au copilote marketing", async () => {
    const owner = await makeOrg({ plan: "starter" });
    const u = await makeUser("Employé Test");
    await db
      .insert(member)
      .values({ organizationId: owner.organization.id, userId: u.id, role: "employee" });
    const employee = await ctxFor(u, owner.organization.id);
    expect(employee.role).toBe("employee");
    await expect(listProducts(employee)).rejects.toThrow();
    await expect(createProduct(employee, input)).rejects.toThrow();
  });

  it("active et désactive le module rendez-vous", async () => {
    const ctx = await makeOrg();
    await setBookingModule(ctx, false);
    const [o] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organization.id));
    expect(o.bookingModule).toBe(false);
  });
});
