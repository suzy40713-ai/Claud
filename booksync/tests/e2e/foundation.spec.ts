import { expect, test } from "@playwright/test";

test.describe("site public", () => {
  test("la page d'accueil commerciale est complète et en français", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page).toHaveTitle(/BookSync — Vos rendez-vous, parfaitement organisés/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vos rendez-vous");
    for (const id of ["fonctionnalites", "avantages", "tarifs", "faq"])
      await expect(page.locator(`#${id}`)).toBeAttached();
    await expect(page.locator("#tarifs")).toContainText("9,99 €");
    await expect(page.locator("#tarifs")).toContainText("19,99 €");
    await page.getByRole("link", { name: "Commencer gratuitement" }).first().click();
    await expect(page).toHaveURL(/\/inscription$/);
  });

  test("les pages légales sont accessibles depuis le pied de page", async ({ page }) => {
    for (const [name, title] of [
      ["Mentions légales", "Mentions légales"],
      ["Conditions générales", "Conditions générales d'utilisation et de vente"],
      ["Politique de confidentialité", "Politique de confidentialité"],
    ]) {
      await page.goto("/");
      await page.getByRole("contentinfo").getByRole("link", { name }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    }
  });

  test("aucun défilement horizontal (accueil, connexion, CGU)", async ({ page }) => {
    for (const path of ["/", "/connexion", "/inscription", "/conditions-generales"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("le basculement de thème clair/sombre fonctionne", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole("button", { name: "Changer de thème" }).first().click();
    await expect(html).toHaveClass(/dark/);
  });

  test("la sonde de santé répond 200 avec la base connectée", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", database: "ok" });
  });

  test("les en-têtes de sécurité sont présents", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("une page inexistante affiche une 404 en français", async ({ page }) => {
    // Rendu en streaming : le statut HTTP reste 200, mais la page est marquée « noindex ».
    await page.goto("/une-entreprise-qui-n-existe-pas");
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    const robots = await page
      .locator('meta[name="robots"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("content")).join(","));
    expect(robots).toMatch(/noindex/);
    const res = await page.goto("/route/vraiment/inexistante");
    expect(res?.status()).toBe(404);
  });

  test("les tâches planifiées refusent un appel sans secret", async ({ request }) => {
    expect((await request.get("/api/cron/notifications")).status()).toBe(401);
  });
});
