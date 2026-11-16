import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createOrganization, setPlan, signUpAndVerify, sql } from "./helpers";

/** Lien « donner mon avis » (même signature que l'application). */
function reviewToken(appointmentId: string) {
  const secret = process.env.BETTER_AUTH_SECRET!;
  const sig = createHmac("sha256", secret)
    .update(`booksync:avis:${appointmentId}`)
    .digest("base64url")
    .slice(0, 32);
  return `${appointmentId}.${sig}`;
}

async function proWithServices(page: import("@playwright/test").Page, name: string) {
  await signUpAndVerify(page, { name });
  const slug = `rv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, `Studio ${slug.slice(-5)}`, slug, "coiffure");
  await page.getByTestId("setup-services").getByRole("button").first().click();
  await page.getByRole("button", { name: "Ajouter ces prestations" }).click();
  await expect(page.getByText("Prestations ajoutées")).toBeVisible();
  await sql`update organization set min_notice_minutes = 0 where slug = ${slug}`;
  await sql`delete from working_hours wh using organization o where wh.organization_id = o.id and o.slug = ${slug}`;
  await sql`
    insert into working_hours (organization_id, staff_id, weekday, start_minute, end_minute)
    select o.id, s.id, d, 0, 1439 from organization o join staff s on s.organization_id = o.id, generate_series(1,7) d
    where o.slug = ${slug}`;
  await setPlan(slug, "starter");
  return slug;
}

test("avis vérifié : le client note sa visite, l'avis s'affiche, le pro répond", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const slug = await proWithServices(page, "Sarah Benali");

  // Un client réserve en ligne.
  const visitor = await browser.newContext({ locale: "fr-FR" });
  const v = await visitor.newPage();
  await v.goto(`/${slug}`);
  await v.getByTestId("public-service").first().click();
  await v.getByTestId("slot").first().click();
  await v.getByLabel("Prénom").fill("Hugo");
  await v.getByLabel("Nom", { exact: true }).fill("Moreau");
  await v.getByLabel("Email", { exact: true }).fill(`hugo.${Date.now()}@example.com`);
  await v.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
  await expect(v.getByTestId("manage-title")).toHaveText("Rendez-vous confirmé !");

  // Avant le rendez-vous : pas encore d'avis possible.
  const [appt] = await sql<{ id: string }[]>`
    select a.id from appointment a join organization o on o.id = a.organization_id
    where o.slug = ${slug} order by a.created_at desc limit 1`;
  await v.goto(`/avis/${reviewToken(appt.id)}`);
  await expect(v.getByTestId("review-title")).toHaveText(
    "Vous pourrez donner votre avis après votre rendez-vous.",
  );

  // Le rendez-vous a eu lieu (décalé dans le passé) : le client note depuis le lien de l'email.
  await sql`update appointment set starts_at = starts_at - interval '5 days', ends_at = ends_at - interval '5 days', blocked_until = blocked_until - interval '5 days' where id = ${appt.id}`;
  await v.goto(`/avis/${reviewToken(appt.id)}?note=5`);
  await expect(v.getByTestId("review-title")).toHaveText("Comment s'est passé votre rendez-vous ?");
  await expect(v.getByRole("button", { name: "5 étoiles sur 5" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await v.getByRole("button", { name: "4 étoiles sur 5" }).click();
  await v.getByLabel(/Votre commentaire/).fill("Coupe nickel, très bon accueil.");
  await v.getByRole("button", { name: "Publier mon avis" }).click();
  await expect(v.getByTestId("review-title")).toHaveText("Merci, votre avis est publié.");

  // Lien falsifié : page introuvable.
  await v.goto(`/avis/${appt.id}.${"A".repeat(32)}`);
  await expect(v.getByRole("heading", { name: "Page introuvable" })).toBeVisible();

  // Page publique : note moyenne et avis, avec prénom + initiale seulement.
  await v.goto(`/${slug}`);
  const section = v.getByTestId("public-reviews");
  await expect(section).toContainText("Coupe nickel, très bon accueil.");
  await expect(section).toContainText("Hugo M.");
  await expect(section).not.toContainText("Moreau");
  await expect(section).toContainText("(1 avis)");

  // Le professionnel répond depuis son espace.
  await page.goto("/tableau-de-bord/avis");
  const item = page.getByTestId("review-list").getByRole("listitem").first();
  await expect(item).toContainText("Hugo Moreau");
  await item.getByRole("button", { name: "Répondre" }).click();
  await page.getByLabel("Votre réponse").fill("Merci Hugo, à bientôt !");
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByText("Réponse publiée.")).toBeVisible();
  await v.reload();
  await expect(v.getByTestId("public-reviews")).toContainText("Merci Hugo, à bientôt !");
  await visitor.close();
});

test("acompte : montant annoncé avant la réservation ; sans Stripe, rien n'est réservé", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const slug = await proWithServices(page, "Julie Caron");

  // Page Paiements : forfait Starter, mais Stripe n'est pas configuré sur cet environnement de test.
  await page.goto("/tableau-de-bord/parametres/paiements");
  await expect(page.getByText(/Le paiement en ligne n'est pas encore disponible/)).toBeVisible();

  // Compte Stripe connecté (simulé en base) et acompte fixe de 10 €.
  await sql`update organization set stripe_account_id = ${`acct_e2e_${slug}`}, stripe_account_ready = true, deposit_mode = 'fixed', deposit_value = 1000 where slug = ${slug}`;
  const visitor = await browser.newContext({ locale: "fr-FR" });
  const v = await visitor.newPage();
  await v.goto(`/${slug}`);
  await v.getByTestId("public-service").first().click();
  await v.getByTestId("slot").first().click();
  await expect(v.getByTestId("deposit-notice")).toContainText("Acompte de 10,00");
  await expect(v.getByTestId("deposit-notice")).toContainText("Remboursé si vous annulez");
  await v.getByLabel("Prénom").fill("Lina");
  await v.getByLabel("Nom", { exact: true }).fill("Petit");
  await v.getByLabel("Email", { exact: true }).fill(`lina.${Date.now()}@example.com`);
  await v.getByRole("button", { name: /Payer l'acompte de 10,00/ }).click();
  // Aucune clé Stripe ici : message clair et aucun rendez-vous ne reste bloqué.
  await expect(v.getByText(/paiement de l'acompte est momentanément indisponible/)).toBeVisible();
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from appointment a join organization o on o.id = a.organization_id
    where o.slug = ${slug}`;
  expect(n).toBe(0);
  await visitor.close();
});
