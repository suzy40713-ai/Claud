import { expect, test } from "@playwright/test";
import { signUpAndVerify } from "./helpers";

test("copilote : inscription sans rendez-vous, premier produit, fiche, modification, suppression", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpAndVerify(page, { name: "Léa Martin" });
  await page.getByLabel("Nom de l'entreprise").fill(`Lumi ${Date.now().toString(36)}`);
  await page.getByLabel("Votre activité").selectOption("ecommerce");
  await page.getByLabel(/Non, je vends des produits/).check();
  await page.getByRole("button", { name: "Créer mon entreprise" }).click();
  await expect(page).toHaveURL(/\/tableau-de-bord\/produits\/nouveau\?premier=1$/);
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

  // Module rendez-vous désactivé : accueil marketing, pas de calendrier dans le menu.
  await page.goto("/tableau-de-bord");
  await expect(page.getByTestId("marketing-home")).toContainText("Bougies Lumi");
  await expect(page.getByTestId("marketing-home")).toContainText("1 / 1");
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

  // Réactivation du module rendez-vous depuis les paramètres.
  await page.goto("/tableau-de-bord/parametres/modules");
  await page.getByRole("switch", { name: "Module rendez-vous" }).click();
  await expect(page.getByText("Module rendez-vous activé.")).toBeVisible();
  await page.goto("/tableau-de-bord");
  await expect(page.getByTestId("marketing-strip")).toBeVisible();
});
