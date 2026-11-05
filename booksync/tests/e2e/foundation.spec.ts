import { expect, test } from "@playwright/test";

test.describe("socle de l'application", () => {
  test("la page d'accueil est en français et affiche l'état du système", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page).toHaveTitle(/BookSync/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("La prise de rendez-vous");
    const status = page.getByTestId("system-status");
    await expect(status).toHaveAttribute("data-ok", "true");
    await expect(status).toContainText("Tous les systèmes sont opérationnels");
  });

  test("aucun défilement horizontal (mobile comme desktop)", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("le basculement de thème clair/sombre fonctionne", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole("button", { name: "Changer de thème" }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test("la sonde de santé répond 200 avec la base connectée", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("no-store");
    expect(await res.json()).toMatchObject({ status: "ok", database: "ok" });
  });

  test("les en-têtes de sécurité sont présents", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("une page inexistante affiche une 404 en français", async ({ page }) => {
    const res = await page.goto("/page-qui-n-existe-pas");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });
});
