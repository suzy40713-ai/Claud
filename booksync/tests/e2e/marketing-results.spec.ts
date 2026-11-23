import { expect, test } from "@playwright/test";
import { signUpAndVerify } from "./helpers";

test("statistiques marketing : saisie réelle, indicateurs calculés, aucun chiffre inventé", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpAndVerify(page, { name: "Inès Roux" });
  await page.getByLabel("Nom de l'entreprise").fill(`Studio ${Date.now().toString(36)}`);
  await page.getByLabel("Votre activité").selectOption("ecommerce");
  await page.getByLabel(/Non, je vends des produits/).check();
  await expect(page.getByLabel("Votre activité")).toHaveValue("ecommerce");
  await page.getByRole("button", { name: "Créer mon entreprise" }).click();
  await expect(page).toHaveURL(/produits\/nouveau/);

  await page.goto("/tableau-de-bord/resultats");
  await expect(page.getByRole("heading", { name: "Statistiques marketing" })).toBeVisible();
  const summary = page.getByTestId("results-summary");
  await expect(summary).toContainText("Aucun résultat saisi");
  await expect(summary).toContainText("Il faut une dépense et des ventes");

  const form = page.getByTestId("result-form");
  await form.getByLabel("Canal").selectOption("tiktok");
  await form.getByLabel("Dépense publicitaire (€)").fill("20");
  await form.getByLabel("Clics").fill("40");
  await form.getByLabel("Ventes").fill("2");
  await form.getByLabel("Chiffre d'affaires (€)").fill("59,80");
  await form.getByRole("button", { name: "Enregistrer ce résultat" }).click();
  await expect(page.getByTestId("results-list")).toContainText("TikTok");
  await expect(summary).toContainText("10,00 €"); // coût par vente
  await expect(summary).toContainText("× 2,99"); // retour sur dépense
  await expect(summary).toContainText("5 %"); // conversion
  await expect(page.getByTestId("results-by-channel")).toContainText("TikTok");

  // Saisie invalide : message, rien d'enregistré.
  await form.getByLabel("Ventes").fill("abc");
  await form.getByRole("button", { name: "Enregistrer ce résultat" }).click();
  await expect(page.getByText(/nombre entier attendu/)).toBeVisible();

  await page.goto("/tableau-de-bord");
  await expect(page.getByTestId("marketing-home")).toContainText("Ventes déclarées (30 j)");
  await expect(page.getByTestId("marketing-home")).toContainText("Dépense : 20,00 €");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});
