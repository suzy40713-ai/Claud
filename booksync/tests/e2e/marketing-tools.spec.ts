import { expect, test } from "@playwright/test";
import { AD, CONTENT, SALES, STRATEGY } from "../fixtures/marketing";
import { signUpAndVerify, sql } from "./helpers";

/**
 * Les outils IA ne sont pas activés dans l'environnement de test (aucune clé API) :
 * on vérifie l'état honnête « pas encore activé », puis l'affichage de résultats
 * enregistrés directement en base (aucun appel au modèle, aucun coût).
 */
test("copilote : outils marketing, état sans IA et affichage des résultats", async ({ page }) => {
  test.setTimeout(120_000);
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
  await page.getByLabel("Catégorie").selectOption("physique");
  await page.getByRole("button", { name: "Ajouter le produit" }).click();
  await expect(page.getByTestId("product-name")).toHaveText("Bougies Lumi");
  const productId = page.url().split("/").pop()!;

  // Chaque outil est accessible depuis la fiche produit et le menu.
  await expect(
    page.getByTestId("product-tools").getByRole("link", { name: "Stratégie 30 jours" }),
  ).toHaveAttribute("href", `/tableau-de-bord/strategies?produit=${productId}`);
  await page.goto(`/tableau-de-bord/strategies?produit=${productId}`);
  await expect(page.getByRole("heading", { name: "Stratégies" })).toBeVisible();
  await expect(page.getByTestId("ai-not-configured")).toBeVisible();
  await expect(page.getByTestId("tool-form")).toHaveCount(0);
  for (const [path, title] of [
    ["publicites", "Publicités"],
    ["contenus", "Contenus"],
    ["sales-booster", "Sales Booster"],
  ]) {
    await page.goto(`/tableau-de-bord/${path}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByTestId("ai-not-configured")).toBeVisible();
  }

  // Résultats enregistrés : affichage complet.
  const [{ organization_id: orgId }] = await sql<
    { organization_id: string }[]
  >`select organization_id from product where id = ${productId}`;
  const ids: Record<string, string> = {};
  for (const [kind, output, choix] of [
    ["strategy", STRATEGY, { "Objectif principal": "Faire mes premières ventes" }],
    ["ad", AD, { Plateforme: "Google Ads (Réseau de Recherche)" }],
    ["content", CONTENT, { Plateforme: "TikTok" }],
    ["sales", SALES, { "Votre situation": "Des visites mais peu de ventes" }],
  ] as const) {
    const [row] = await sql<{ id: string }[]>`
      insert into ai_generation (organization_id, product_id, kind, model, input_hash, input, output)
      values (${orgId}, ${productId}, ${kind}, 'claude-haiku-5-5', ${`e2e-${kind}`},
              ${sql.json({ choix })}, ${sql.json(output as never)})
      returning id`;
    ids[kind] = row.id;
  }

  await page.goto(`/tableau-de-bord/strategies/${ids.strategy}`);
  await expect(page.getByTestId("tool-result-title")).toContainText("Bougies Lumi");
  await expect(page.getByText("Faire mes premières ventes")).toBeVisible();
  await page.getByText(/^Semaine 4/).click();
  await expect(page.getByText("Jour 28 · Thème du jour 28")).toBeVisible();
  await page.getByText("Jours 29 et 30").click();
  await expect(page.getByText("Filmer la coulée 30")).toBeVisible();


  // Autopilot : lancé depuis la stratégie, 3 actions du jour à cocher.
  await page.getByTestId("start-autopilot").click();
  await expect(page).toHaveURL(/\/tableau-de-bord\/autopilot-marketing$/);
  const today = page.getByTestId("today-tasks");
  await expect(today.getByTestId("marketing-task")).toHaveCount(3);
  await today.getByText("Filmer la coulée 1").click();
  await expect(today.getByRole("checkbox").first()).toBeChecked();
  await page.reload();
  await expect(page.getByTestId("today-tasks").getByRole("checkbox").first()).toBeChecked();
  await expect(page.getByTestId("marketing-autopilot")).toContainText("1 / 90");
  await expect(page.getByTestId("marketing-autopilot")).toContainText("1 / 30");

  await page.goto(`/tableau-de-bord/publicites/${ids.ad}`);
  await expect(page.getByTestId("ad-view")).toContainText("Bougies faites main");
  await expect(page.getByTestId("ad-view")).toContainText("(19/30)");

  await page.goto(`/tableau-de-bord/contenus/${ids.content}`);
  await expect(page.getByTestId("content-view")).toContainText("#faitmain");

  await page.goto(`/tableau-de-bord/sales-booster/${ids.sales}`);
  await expect(page.getByTestId("sales-view")).toContainText("Je la veux");

  // L'historique liste le résultat ; un identifiant inconnu donne une page introuvable.
  await page.goto("/tableau-de-bord/publicites");
  await expect(page.getByTestId("tool-history")).toContainText("Bougies Lumi");
  await page.goto(`/tableau-de-bord/publicites/${ids.content}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.goto("/tableau-de-bord/contenus");

  // Pas de débordement horizontal sur mobile.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});
