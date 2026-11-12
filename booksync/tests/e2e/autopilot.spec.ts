import { expect, test } from "@playwright/test";
import {
  createOrganization,
  latestEmailLink,
  setPlan,
  signUpAndVerify,
  sql,
  uniqueEmail,
} from "./helpers";

test("Autopilot : automatisations par forfait, désactivation et historique", async ({ page }) => {
  await signUpAndVerify(page, { name: "Inès Robert" });
  const slug = `auto-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, "Institut Inès", slug);

  // Forfait Free : les emails clients sont réservés au forfait Starter.
  await page.goto("/tableau-de-bord/autopilot");
  await expect(page.getByRole("heading", { name: "Autopilot", level: 1 })).toBeVisible();
  const reminder = page.getByRole("switch", { name: "Rappel 24 heures avant" });
  await expect(reminder).toBeDisabled();
  await expect(reminder).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Détection des conflits" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Détection des conflits" })).toBeDisabled();

  // Forfait Starter : rappel actif par défaut, désactivable, et tracé dans l'historique.
  await setPlan(slug, "starter");
  await page.reload();
  await expect(reminder).toBeEnabled();
  await expect(reminder).toBeChecked();
  await reminder.click();
  await expect(page.getByText("Automatisation désactivée.")).toBeVisible();
  await expect(reminder).not.toBeChecked();
  await expect(
    page.getByTestId("autopilot-activity").filter({ hasText: "Rappel 24 heures avant désactivée" }),
  ).toBeVisible();
  await page.reload();
  await expect(reminder).not.toBeChecked();

  // L'ancienne page de réglages renvoie vers Autopilot.
  await page.goto("/tableau-de-bord/parametres/notifications");
  await expect(page).toHaveURL(/\/tableau-de-bord\/autopilot$/);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("liste d'attente : inscription publique, annulation, proposition par email, réservation", async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  await signUpAndVerify(page, { name: "Marc Petit" });
  const slug = `attente-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, "Barbier Marc", slug, "barbier");
  await page.getByTestId("setup-services").getByRole("button").first().click();
  await page.getByRole("button", { name: "Ajouter ces prestations" }).click();
  await expect(page.getByText("Prestations ajoutées")).toBeVisible();
  await setPlan(slug, "pro");
  // Créneaux à plus de 24 h : une proposition n'est envoyée que si le rendez-vous n'est pas imminent.
  await sql`update organization set min_notice_minutes = 1440, cancellation_notice_hours = 0 where slug = ${slug}`;
  await sql`delete from working_hours wh using organization o where wh.organization_id = o.id and o.slug = ${slug}`;
  await sql`
    insert into working_hours (organization_id, staff_id, weekday, start_minute, end_minute)
    select o.id, s.id, d, 480, 1200 from organization o join staff s on s.organization_id = o.id, generate_series(1,7) d
    where o.slug = ${slug}`;

  // Client A réserve le premier créneau disponible (dans plus de 24 h).
  const a = await browser.newContext({ locale: "fr-FR" });
  const pa = await a.newPage();
  await pa.goto(`/${slug}`);
  await pa.getByTestId("public-service").first().click();
  await pa.getByTestId("slot").first().click();
  await pa.getByLabel("Prénom").fill("Alice");
  await pa.getByLabel("Nom", { exact: true }).fill("Durand");
  await pa.getByLabel("Email", { exact: true }).fill(uniqueEmail("alice"));
  await pa.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
  await expect(pa.getByTestId("manage-title")).toHaveText("Rendez-vous confirmé !");
  const manageUrl = pa.url();

  // Client B s'inscrit sur la liste d'attente depuis la page publique.
  const b = await browser.newContext({ locale: "fr-FR" });
  const pb = await b.newPage();
  await pb.goto(`/${slug}`);
  await pb.getByRole("link", { name: "Rejoindre la liste d'attente" }).click();
  await expect(pb.getByRole("heading", { name: "Liste d'attente" })).toBeVisible();
  const bob = uniqueEmail("bob");
  await pb.getByLabel("Prénom").fill("Bob");
  await pb.getByLabel("Nom", { exact: true }).fill("Leroy");
  await pb.getByLabel("Email").fill(bob);
  await pb.getByRole("button", { name: "M'inscrire sur la liste d'attente" }).click();
  await expect(pb.getByTestId("waitlist-joined")).toBeVisible();

  // Le professionnel voit l'inscription.
  await page.goto("/tableau-de-bord/liste-attente");
  await expect(page.getByTestId("waitlist-entry").filter({ hasText: "Bob Leroy" })).toBeVisible();

  // A annule : B reçoit la proposition par email.
  await pa.goto(manageUrl.replace(/\?.*$/, ""));
  await pa.getByRole("button", { name: "Annuler", exact: true }).click();
  await pa.getByRole("button", { name: "Confirmer l'annulation" }).click();
  await expect(pa.getByTestId("manage-title")).toHaveText("Rendez-vous annulé");
  await expect
    .poll(
      async () =>
        (await sql`select 1 from email_message where "to" = ${bob} and template = 'waitlist_offer'`)
          .length,
      {
        timeout: 15_000,
      },
    )
    .toBe(1);
  const offerUrl = await latestEmailLink(bob, "waitlist_offer");
  await pb.goto(offerUrl);
  await expect(pb.getByTestId("offer-title")).toHaveText("Un créneau s'est libéré pour vous");
  await pb.getByRole("button", { name: "Réserver ce créneau" }).click();
  await expect(pb.getByTestId("manage-title")).toHaveText("Rendez-vous confirmé !");
  await pb.goto(offerUrl);
  await expect(pb.getByTestId("offer-title")).toHaveText("Ce créneau est réservé pour vous");

  await page.reload();
  await expect(page.getByText("Rendez-vous obtenu")).toBeVisible();
  await a.close();
  await b.close();
});

test("analyses : réservées au forfait Pro, affichées sans erreur", async ({ page }) => {
  await signUpAndVerify(page, { name: "Nora Lambert" });
  const slug = `analyse-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, "Studio Nora", slug);
  await page.goto("/tableau-de-bord/analyses");
  await expect(page.getByText(/est inclus dans le forfait/)).toBeVisible();
  await setPlan(slug, "pro");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Recommandations" })).toBeVisible();
  await expect(page.getByTestId("recommendation").first()).toContainText(
    "Pas encore assez de données",
  );
  await expect(page.getByText("Une erreur est survenue")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("assistant : réservé au Pro, désactivé sans clé d'API (aucun appel payant)", async ({
  page,
}) => {
  await signUpAndVerify(page, { name: "Yanis Bel" });
  const slug = `assist-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, "Atelier Yanis", slug);
  await page.goto("/tableau-de-bord/assistant");
  await expect(page.getByText(/est inclus dans le forfait/)).toBeVisible();
  await setPlan(slug, "pro");
  await page.reload();
  await expect(page.getByText("L'assistant n'est pas encore activé.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Votre question" })).toBeDisabled();
  await expect(page.getByTestId("assistant-usage")).toContainText("0 / 300 questions");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
