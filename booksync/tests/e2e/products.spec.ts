import { expect, test } from "@playwright/test";
import { createOrganization, signUpAndVerify } from "./helpers";

test("copilote : inscription sans rendez-vous, premier produit, fiche, modification, suppression", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpAndVerify(page, { name: "Léa Martin" });
  await createOrganization(page, `Lumi ${Date.now().toString(36)}`);
  await expect(page.getByText(/Dernière étape/)).toBeVisible();

  // Validation côté serveur : description trop courte.
  await page.getByLabel("Nom du produit ou du service").fill("Bougies Lumi");
  await page.getByLabel("Description").fill("Trop court");
  await page.getByLabel("Catégorie").selectOption("physique");
  await page.getByRole("button", { name: "Ajouter le produit" }).click();
  await expect(page.getByText(/20 caractères minimum/)).toBeVisible();

  await page
    .getByLabel("Description")
    .fill("Bougies parfumées coulées à la main en petites séries.");
  await page.getByLabel("Prix (€ TTC)").fill("24,90");
  await page.getByRole("button", { name: "Ajouter le produit" }).click();
  await expect(page.getByTestId("product-name")).toHaveText("Bougies Lumi");
  await expect(page.getByText("24,90 €")).toBeVisible();
  // Analyse gratuite (sans IA) : disponible tout de suite.
  await page.goto("/tableau-de-bord/analyse-produit");
  await expect(page.getByTestId("analysis-products")).toContainText("Pas encore analysé");
  await page.goBack();
  await page.getByTestId("analyze-product").click();
  await expect(page.getByTestId("product-analysis")).toContainText("Bougies Lumi");
  await expect(page.getByTestId("product-analysis")).toContainText("Hypothèse à vérifier");

  // Module rendez-vous désactivé : accueil marketing, pas de calendrier dans le menu.
  await page.goto("/tableau-de-bord");
  await expect(page.getByTestId("journey")).toContainText("Créer votre stratégie 30 jours");
  await expect(page.getByTestId("activity-counts")).toContainText("Produits1");
  await expect(page.getByTestId("first-sale-goal")).toBeVisible();
  await expect(page.getByRole("link", { name: "Calendrier" })).toHaveCount(0);

  // Forfait Free : 1 produit maximum, l'ajout propose de changer de forfait.
  await page.goto("/tableau-de-bord/produits");
  await expect(page.getByRole("link", { name: "Passer à un forfait supérieur" })).toBeVisible();

  // Modification puis suppression.
  await page.getByTestId("product-list").getByRole("link").first().click();
  await page.getByRole("link", { name: "Modifier" }).click();
  await page.getByLabel("Nom du produit ou du service").fill("Bougies Lumi XL");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByTestId("product-name")).toHaveText("Bougies Lumi XL");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(/\/tableau-de-bord\/produits$/);
  await expect(page.getByText("Ajoutez votre premier produit")).toBeVisible();

  // Le module rendez-vous n'existe plus : ses pages renvoient à l'accueil.
  await page.goto("/tableau-de-bord/parametres/modules");
  await expect(page).toHaveURL(/\/tableau-de-bord$/);
  await page.goto("/tableau-de-bord/calendrier");
  await expect(page).toHaveURL(/\/tableau-de-bord$/);
});
