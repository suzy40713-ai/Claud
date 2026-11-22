import { expect, test } from "@playwright/test";
import { createOrganization, setPlan, signUpAndVerify, sql } from "./helpers";

test("rendez-vous en visio : réservé au forfait Starter, lien transmis au client", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await signUpAndVerify(page, { name: "Sarah Coach" });
  const slug = `vi-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, `Coaching ${slug.slice(-5)}`, slug, "coach");
  await page.getByTestId("setup-services").getByRole("button").first().click();
  await page.getByRole("button", { name: "Ajouter ces prestations" }).click();
  await expect(page.getByText("Prestations ajoutées")).toBeVisible();
  await sql`update organization set min_notice_minutes = 0 where slug = ${slug}`;
  await sql`delete from working_hours wh using organization o where wh.organization_id = o.id and o.slug = ${slug}`;
  await sql`
    insert into working_hours (organization_id, staff_id, weekday, start_minute, end_minute)
    select o.id, s.id, d, 0, 1439 from organization o join staff s on s.organization_id = o.id, generate_series(1,7) d
    where o.slug = ${slug}`;

  // Forfait gratuit : la visio est verrouillée.
  await page.goto("/tableau-de-bord/parametres/reservation");
  await expect(page.getByRole("heading", { name: "Rendez-vous en visio" })).toBeVisible();
  await expect(page.getByText(/Le lien de visio est inclus dans le forfait/)).toBeVisible();
  await expect(page.getByLabel("Lien de votre salle de visio")).toHaveCount(0);

  // Forfait Starter : lien enregistré (https ajouté automatiquement).
  await setPlan(slug, "starter");
  await page.reload();
  await page.getByLabel("Lien de votre salle de visio").fill("meet.google.com/abc-defg-hij");
  await page.getByRole("button", { name: "Enregistrer le lien" }).click();
  await expect(page.getByText("Lien de visio enregistré.")).toBeVisible();
  const [{ meeting_url }] = await sql<{ meeting_url: string }[]>`
    select meeting_url from organization where slug = ${slug}`;
  expect(meeting_url).toBe("https://meet.google.com/abc-defg-hij");

  // Côté client : badge visio, puis bouton « Rejoindre la visio » après la réservation.
  const visitor = await browser.newContext({ locale: "fr-FR" });
  const v = await visitor.newPage();
  await v.goto(`/${slug}`);
  await expect(v.getByTestId("online-badge")).toBeVisible();
  await v.getByTestId("public-service").nth(1).click();
  await v.getByTestId("slot").first().click();
  await v.getByLabel("Prénom").fill("Léa");
  await v.getByLabel("Nom", { exact: true }).fill("Roux");
  await v.getByLabel("Email", { exact: true }).fill(`lea.${Date.now()}@example.com`);
  await v.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
  await expect(v.getByTestId("manage-title")).toHaveText("Rendez-vous confirmé !");
  const join = v.getByRole("link", { name: "Rejoindre la visio" });
  await expect(join).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
  await visitor.close();
});
