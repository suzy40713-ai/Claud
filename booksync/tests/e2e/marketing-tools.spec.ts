import { expect, test } from "@playwright/test";
import { createOrganization, signUpAndVerify, sql } from "./helpers";

/** Outils marketing gratuits (sans IA) : parcours réel, de la fiche produit à l'Autopilot. */
test("copilote : stratégie, plan d'action, publicités, contenus, ventes, clients, concurrence", async ({ page }) => {
  test.setTimeout(150_000);
  await signUpAndVerify(page, { name: "Nora Petit" });
  const orgName = `Atelier ${Date.now().toString(36)}`;
  await createOrganization(page, orgName);
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
  // Forfait Starter : propositions illimitées (Free : 3 par mois).
  await sql`update organization set plan = 'starter', subscription_status = 'active' where name = ${orgName}`;
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
  // Une amélioration peut rejoindre le plan d'action du jour.
  await page.getByTestId("add-to-plan").first().click();
  await expect(page.getByTestId("add-to-plan").first()).toHaveText(/Ajoutée au plan/);
  await page.goto("/tableau-de-bord/autopilot-marketing");
  await expect(page.getByTestId("today-tasks").getByTestId("marketing-task")).toHaveCount(4);
  await page.getByTestId("add-task").getByRole("textbox").fill("Appeler 3 boutiques déco");
  await page.getByTestId("add-task").getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByTestId("today-tasks")).toContainText("Appeler 3 boutiques déco");

  // Tableau de bord : compteurs et activité récente réels.
  await page.goto("/tableau-de-bord");
  await expect(page.getByTestId("activity-counts")).toContainText("Stratégies");
  await expect(page.getByTestId("activity-history")).toContainText("Optimisation des ventes");

  // Recherche de clients et concurrence (sans adresse : analyse générale, rien d'inventé).
  await page.goto("/tableau-de-bord/clients-cibles");
  await expect(page.getByRole("heading", { name: "Recherche de clients" })).toBeVisible();
  await page.getByTestId("tool-submit").click();
  await expect(page.getByTestId("customers-view")).toContainText("Besoins");
  await expect(page.getByTestId("result-origin")).toContainText("Version modèle BookSync");
  await page.goto("/tableau-de-bord/concurrence");
  await page.getByTestId("tool-submit").click();
  await expect(page.getByTestId("competitors-view")).toContainText("Aucune adresse fournie");
  await expect(page.getByTestId("competitors-view")).toContainText("Comment vous différencier");

  // Assistant IA : sans clé gratuite configurée, pas de faux assistant.
  await expect(page.getByRole("link", { name: "Assistant IA" })).toHaveCount(0);
  await page.goto("/tableau-de-bord/assistant");
  await expect(page.getByTestId("assistant-disabled")).toBeVisible();

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
