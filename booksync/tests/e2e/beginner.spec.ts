import { expect, test } from "@playwright/test";
import { createOrganization, signUpAndVerify, sql } from "./helpers";

test("débutant : idée trouvée sur le site, inscription, idée devenue produit, Académie", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // Page publique : choisir ce qu'on sait faire, puis une idée.
  await page.goto("/lancer-mon-activite");
  await page.getByRole("button", { name: /Je sais monter des vidéos/ }).click();
  await expect(page.getByTestId("idea-card")).toContainText("Montage de vidéos courtes");
  await expect(page.getByTestId("idea-card")).toContainText("Aucun revenu n'est garanti");
  await expect(page.getByTestId("share-idea")).toBeVisible();
  // Lien partagé : l'idée s'affiche directement.
  await page.goto("/lancer-mon-activite?idee=montage");
  await expect(page.getByTestId("idea-card")).toContainText("Montage de vidéos courtes");
  await expect(page.getByRole("link", { name: "Commencer avec cette idée" })).toHaveAttribute(
    "href",
    /\/inscription\?redirection=%2Fonboarding%3Fidee%3Dmontage/,
  );

  // Inscription puis projet : l'idée choisie est proposée tout de suite.
  await signUpAndVerify(page, { name: "Sam Diallo" });
  await page.goto("/onboarding?idee=montage");
  const name = `Projet Sam ${Date.now().toString(36)}`;
  await page.getByLabel("Nom de votre projet").fill(name);
  await page.getByRole("button", { name: "C'est parti" }).click();
  await expect(page).toHaveURL(/\/tableau-de-bord\/trouver-une-idee\?idee=montage$/);
  await page.getByTestId("choose-idea").click();
  await expect(page.getByTestId("product-name")).toHaveText("Montage de vidéos courtes pour créateurs");
  await expect(page.getByText("25,00 €").filter({ visible: true }).first()).toBeVisible();

  // Académie : 3 leçons gratuites, les suivantes verrouillées.
  await page.goto("/tableau-de-bord/academie");
  await expect(page.getByTestId("academy")).toContainText("0 / 15 leçons terminées");
  await page.getByRole("link", { name: /Gagner de l'argent : ce qui marche vraiment/ }).click();
  await page.getByTestId("lesson-done").click();
  await expect(page.getByTestId("lesson-done")).toHaveText(/Terminée/);
  await page.goto("/tableau-de-bord/academie/prix");
  await expect(page.getByTestId("lesson-locked")).toContainText("forfait Starter");
  await page.goto("/tableau-de-bord/academie");
  await expect(page.getByTestId("academy")).toContainText("1 / 15 leçons terminées");

  // Free : 3 propositions par mois, puis invitation à passer à Starter.
  await page.goto("/tableau-de-bord/produits");
  await page.getByTestId("product-list").getByRole("link").first().click();
  for (let i = 0; i < 3; i++) {
    await page.getByTestId("analyze-product").click();
    await expect(page.getByTestId("product-analysis")).toBeVisible();
  }
  await page.getByTestId("analyze-product").click();
  await expect(page.getByText(/3 propositions par mois/)).toBeVisible();

  // Abonné Starter : jauge « rentabiliser mon abonnement ».
  await sql`update organization set plan = 'starter', subscription_status = 'active' where name = ${name}`;
  await page.goto("/tableau-de-bord");
  await expect(page.getByTestId("profit-goal")).toContainText("Rentabiliser mon abonnement");
  await expect(page.getByTestId("profit-goal")).toContainText("0 %");
  await page.goto("/tableau-de-bord/resultats");
  const form = page.getByTestId("result-form");
  await form.getByLabel("Ventes").fill("1");
  await form.getByLabel("Chiffre d'affaires (€)").fill("25");
  await form.getByRole("button", { name: "Enregistrer ce résultat" }).click();
  await expect(page.getByTestId("results-list")).toContainText("1 ventes");
  await page.goto("/tableau-de-bord");
  await expect(page.getByTestId("profit-goal")).toContainText("Abonnement rentabilisé");
  await expect(page.getByTestId("profit-goal")).toContainText("100 %");

  // Page de bienvenue après achat.
  await page.goto("/tableau-de-bord/bienvenue?forfait=starter");
  await expect(page.getByTestId("welcome")).toContainText("Bienvenue dans Starter");
  await expect(page.getByTestId("welcome")).toContainText("rentabiliser vos 9,99 €");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});

test("projet créé avec « J'ai déjà quelque chose à vendre » : fiche produit directement", async ({
  page,
}) => {
  await signUpAndVerify(page);
  await createOrganization(page, `Vendeur ${Date.now().toString(36)}`, "produit");
  await expect(page.getByTestId("product-form")).toBeVisible();
});
