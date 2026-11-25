import { expect, test } from "@playwright/test";
import { createOrganization, signUpAndVerify } from "./helpers";

test("statistiques marketing : saisie réelle, indicateurs calculés, aucun chiffre inventé", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpAndVerify(page, { name: "Inès Roux" });
  await createOrganization(page, `Studio ${Date.now().toString(36)}`);
  await expect(page).toHaveURL(/produits\/nouveau/);

  await page.goto("/tableau-de-bord/resultats");
  await expect(page.getByRole("heading", { name: "Mes résultats" })).toBeVisible();
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
  await expect(page.getByTestId("marketing-home")).toContainText("Ventes ce mois-ci");
  await expect(page.getByTestId("marketing-home")).toContainText("Chiffre d'affaires : 59,80 €");
  await expect(page.getByTestId("weekly-chart")).toContainText("59,80 €");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});
