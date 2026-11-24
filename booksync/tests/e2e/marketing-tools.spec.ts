import { expect, test } from "@playwright/test";
import { signUpAndVerify } from "./helpers";

/** Outils marketing gratuits (sans IA) : parcours réel, de la fiche produit à l'Autopilot. */
test("copilote : stratégie, Autopilot, publicités, contenus et Sales Booster", async ({ page }) => {
  test.setTimeout(150_000);
  await signUpAndVerify(page, { name: "Nora Petit" });
  await page.getByLabel("Nom de l'entreprise").fill(`Atelier ${Date.now().toString(36)}`);
  await page.getByLabel("Votre activité").selectOption("ecommerce");
  await page.getByLabel(/Non, je vends des produits/).check();
  await expect(page.getByLabel("Votre activité")).toHaveValue("ecommerce");
  await page.getByRole("button", { name: "Créer mon entreprise" }).click();
  await expect(page).toHaveURL(/produits\/nouveau/);
  await page.getByLabel("Nom du produit ou du service").fill("Bougies Lumi");
  await page
    .getByLabel("Description")
    .fill("Bougies parfumées coulées à la main en petites séries.");
  await page.getByLabel("Prix (€ TTC)").fill("24,90");
  await page.getByLabel("Catégorie").selectOption("physique");
  await page.getByRole("button", { name: "Ajouter le produit" }).click();
  await expect(page.getByTestId("product-name")).toHaveText("Bougies Lumi");
  const productId = page.url().split("/").pop()!;
  await expect(
    page.getByTestId("product-tools").getByRole("link", { name: "Stratégie 30 jours" }),
  ).toHaveAttribute("href", `/tableau-de-bord/strategies?produit=${productId}`);

  // Stratégie 30 jours.
  await page.goto(`/tableau-de-bord/strategies?produit=${productId}`);
  await page.getByRole("button", { name: "Email / newsletter" }).click();
  await page.getByLabel("Budget publicitaire mensuel").selectOption("50");
  await page.getByTestId("tool-submit").click();
  await expect(page).toHaveURL(/\/tableau-de-bord\/strategies\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("tool-result-title")).toContainText("Bougies Lumi");
  await expect(page.getByText("Email / newsletter").first()).toBeVisible();
  await page.getByText(/^Semaine 4/).click();
  await expect(page.getByText(/Jour 22 ·/)).toBeVisible();
  await expect(page.getByText(/publicité test \(2 € par jour/)).toBeVisible();

  // Autopilot : 3 actions du jour à cocher.
  await page.getByTestId("start-autopilot").click();
  await expect(page).toHaveURL(/\/tableau-de-bord\/autopilot-marketing$/);
  const today = page.getByTestId("today-tasks");
  await expect(today.getByTestId("marketing-task")).toHaveCount(3);
  await today.getByRole("checkbox").first().click();
  await expect(today.getByRole("checkbox").first()).toBeChecked();
  await page.reload();
  await expect(page.getByTestId("today-tasks").getByRole("checkbox").first()).toBeChecked();
  await expect(page.getByTestId("marketing-autopilot")).toContainText("1 / 90");

  // Publicité Google : limites de caractères respectées.
  await page.goto("/tableau-de-bord/publicites");
  await page.getByLabel("Plateforme").selectOption("google");
  await page.getByLabel("Style").selectOption("demo");
  await page.getByTestId("tool-submit").click();
  await expect(page.getByTestId("ad-view")).toContainText("Bougies Lumi");
  await expect(page.getByTestId("ad-view")).not.toContainText("trop long");

  // Contenus.
  await page.goto("/tableau-de-bord/contenus");
  await page.getByLabel("Format").selectOption("carousel");
  await page.getByTestId("tool-submit").click();
  await expect(page.getByTestId("content-view")).toContainText("#bougieslumi");

  // Sales Booster avec texte collé.
  await page.goto("/tableau-de-bord/sales-booster");
  await page.getByLabel(/Texte de votre page de vente/).fill("Bougie Lumi, coulée à la main.");
  await page.getByTestId("tool-submit").click();
  await expect(page.getByTestId("sales-view")).toContainText("Afficher le prix");

  // Historique ; un identifiant d'un autre outil est introuvable.
  await page.goto("/tableau-de-bord/publicites");
  await expect(page.getByTestId("tool-history")).toContainText("Bougies Lumi");
  const href = await page.getByTestId("tool-history").getByRole("link").first().getAttribute("href");
  await page.goto(href!.replace("publicites", "contenus"));
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});
