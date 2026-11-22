import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createOrganization, setPlan, signUpAndVerify, sql } from "./helpers";

/** Lien d'une carte cadeau (même signature que l'application). */
function giftToken(id: string) {
  const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(`booksync:cadeau:${id}`)
    .digest("base64url")
    .slice(0, 32);
  return `${id}.${sig}`;
}

test("cartes cadeaux : activation, page d'achat, carte imprimable et utilisation au salon", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await signUpAndVerify(page, { name: "Nora Benali" });
  const slug = `cc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, `Atelier ${slug.slice(-5)}`, slug, "coiffure");
  await setPlan(slug, "starter");

  // Sans compte Stripe : la page explique qu'il faut le connecter.
  await page.goto("/tableau-de-bord/cartes-cadeaux");
  await expect(page.getByRole("heading", { name: "Cartes cadeaux", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connecter mon compte Stripe" })).toBeVisible();

  // Compte Stripe connecté (simulé en base) : activation et montants.
  await sql`update organization set stripe_account_id = ${`acct_e2e_${slug}`}, stripe_account_ready = true where slug = ${slug}`;
  await page.reload();
  await page.getByRole("switch", { name: "Vendre des cartes cadeaux en ligne" }).click();
  await page.getByLabel("Montants proposés (en euros)").fill("30, 50");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Cartes cadeaux activées.")).toBeVisible();

  // Côté client : bouton sur la page du salon, puis page d'achat.
  const visitor = await browser.newContext({ locale: "fr-FR" });
  const v = await visitor.newPage();
  await v.goto(`/${slug}`);
  await expect(v.getByTestId("gift-card-cta")).toBeVisible();
  await v.getByRole("link", { name: "Offrir une carte cadeau" }).click();
  await expect(v.getByRole("heading", { name: "Offrir une carte cadeau" })).toBeVisible();
  await expect(v.getByRole("radio", { name: "30 €" })).toBeVisible();
  await v.getByRole("radio", { name: "50 €" }).click();
  await v.getByLabel("Pour qui ?").fill("Maman");
  await v.getByLabel("Votre nom").fill("Julie Martin");
  await v.getByLabel("Votre email").fill(`julie.${Date.now()}@example.com`);
  await v.getByRole("button", { name: "Payer 50 €" }).click();
  // Aucune clé Stripe dans cet environnement : refus clair, aucune carte créée.
  await expect(v.getByRole("alert")).toBeVisible();
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from gift_card g join organization o on o.id = g.organization_id where o.slug = ${slug}`;
  expect(n).toBe(0);

  // Carte payée (simulée en base) : page imprimable via le lien signé.
  const [card] = await sql<{ id: string }[]>`
    insert into gift_card (organization_id, code, status, amount_cents, balance_cents, buyer_name, buyer_email, recipient_name, message, paid_at, expires_at)
    select id, 'ABCD-EFGH', 'active', 5000, 5000, 'Julie Martin', 'julie@example.com', 'Maman', 'Joyeux Noël !', now(), now() + interval '12 months'
    from organization where slug = ${slug}
    returning id`;
  await v.goto(`/carte-cadeau/${giftToken(card.id)}`);
  await expect(v.getByTestId("gift-amount")).toHaveText("50 €");
  await expect(v.getByTestId("gift-code")).toHaveText("ABCD-EFGH");
  await expect(v.getByText("Joyeux Noël !")).toBeVisible();
  // Lien falsifié : page introuvable.
  await v.goto(`/carte-cadeau/${card.id}.${"x".repeat(32)}`);
  await expect(v.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await visitor.close();

  // Au salon : code tapé en minuscules, montant déduit, solde mis à jour.
  await page.goto("/tableau-de-bord/cartes-cadeaux");
  await page.getByLabel("Code de la carte cadeau").fill("abcd efgh");
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page.getByTestId("gift-balance")).toContainText("50 €");
  await page.getByLabel("Montant de la prestation à déduire (€)").fill("20");
  await page.getByRole("button", { name: "Déduire" }).click();
  await expect(page.getByText(/Solde restant : 30\s€/)).toBeVisible();
  await expect(page.getByTestId("gift-balance")).toContainText("30 €");
  await expect(page.getByTestId("gift-list")).toContainText("reste 30 €");
});
