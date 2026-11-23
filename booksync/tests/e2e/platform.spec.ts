import { expect, test } from "@playwright/test";
import { createOrganization, latestEmailLink, signUp, sql, uniqueEmail } from "./helpers";

test("plateforme : un particulier trouve un professionnel, réserve et retrouve son rendez-vous", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  // 1. Un professionnel s'inscrit et rend son établissement visible dans l'annuaire.
  const pro = await signUp(page, { name: "Nadia Ferreira" });
  await page.goto(await latestEmailLink(pro.email, "verify-email"));
  await expect(page).toHaveURL(/\/onboarding$/);
  const slug = `plat-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const tag = slug.slice(-6);
  await createOrganization(page, `Barber ${tag}`, slug, "barbier");
  await page.getByTestId("setup-services").getByRole("button").first().click();
  await page.getByRole("button", { name: "Ajouter ces prestations" }).click();
  await expect(page.getByText("Prestations ajoutées")).toBeVisible();
  await sql`update organization set min_notice_minutes = 0, city = 'Quetigny', postal_code = '21800' where slug = ${slug}`;
  await sql`delete from working_hours wh using organization o where wh.organization_id = o.id and o.slug = ${slug}`;
  await sql`
    insert into working_hours (organization_id, staff_id, weekday, start_minute, end_minute)
    select o.id, s.id, d, 0, 1439 from organization o join staff s on s.organization_id = o.id, generate_series(1,7) d
    where o.slug = ${slug}`;

  // Pas encore visible : l'annuaire n'affiche que les établissements qui l'ont choisi.
  const visitor = await browser.newContext({ locale: "fr-FR" });
  const v = await visitor.newPage();
  await v.goto(`/professionnels?q=${tag}`);
  await expect(v.getByTestId("directory-empty")).toBeVisible();

  await page.goto("/tableau-de-bord/parametres/reservation");
  await page.getByRole("switch", { name: "Visible dans l'annuaire BookSync" }).click();
  await page.getByRole("button", { name: "Enregistrer" }).first().click();
  await expect(page.getByText(/enregistr/i).first()).toBeVisible();

  // 2. Un particulier crée son compte : il arrive dans son espace, pas sur la création d'entreprise.
  const client = await signUp(v, { name: "Hugo Martin", pro: false });
  await v.goto(await latestEmailLink(client.email, "verify-email"));
  await expect(v).toHaveURL(/\/mon-espace$/);
  await expect(v.getByRole("heading", { name: "Bonjour Hugo" })).toBeVisible();

  // 3. Il recherche par métier et code postal, puis réserve depuis la fiche.
  await v.goto("/professionnels");
  await v.getByLabel("Métier").selectOption("barbier");
  await v.getByLabel("Ville ou code postal").fill("21800");
  await v.getByLabel("Recherche").fill(tag);
  await v.getByRole("button", { name: "Rechercher" }).click();
  const card = v.getByTestId("directory-result").filter({ hasText: `Barber ${tag}` });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Prochain créneau");
  await card.getByRole("link", { name: "Prendre rendez-vous" }).click();
  await expect(v).toHaveURL(new RegExp(`/${slug}$`));
  await v.getByTestId("public-service").first().click();
  await v.getByTestId("slot").first().click();
  // Coordonnées pré-remplies depuis son compte.
  await expect(v.getByLabel("Email", { exact: true })).toHaveValue(client.email);
  await expect(v.getByLabel("Prénom")).toHaveValue("Hugo");
  await v.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
  await expect(v.getByTestId("manage-title")).toHaveText("Rendez-vous confirmé !");

  // 4. Le rendez-vous apparaît dans son espace… et dans l'agenda du professionnel.
  await v.goto("/mon-espace");
  await expect(v.getByTestId("my-appointment").filter({ hasText: `Barber ${tag}` })).toBeVisible();
  await page.goto("/tableau-de-bord/reservations");
  await expect(page.getByText("Hugo Martin").first()).toBeVisible();
  await visitor.close();
  void uniqueEmail;
});

test("annuaire : page publique sans compte, sans débordement mobile", async ({ page }) => {
  await page.goto("/professionnels");
  await expect(page.getByRole("heading", { name: "Trouver un professionnel" })).toBeVisible();
  await expect(
    page.getByLabel("Métier").locator("option", { hasText: "Kinésithérapeute" }),
  ).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Commencer gratuitement/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Je ne sais pas quoi vendre/ })).toBeVisible();
});
