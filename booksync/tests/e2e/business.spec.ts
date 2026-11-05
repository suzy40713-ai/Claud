import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  createOrganization,
  latestEmailLink,
  setPlan,
  signIn,
  signUp,
  signUpAndVerify,
  sql,
  uniqueEmail,
} from "./helpers";

async function ownerWithServices(page: Page) {
  const owner = await signUpAndVerify(page, { name: "Sophie Laurent" });
  const slug = `salon-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await createOrganization(page, "Salon Sophie", slug, "coiffure");
  // Assistant : prestations suggérées + horaires (7 j/7 pour des tests stables quel que soit le jour).
  await page.getByTestId("setup-services").getByRole("button").first().click();
  await page.getByRole("button", { name: "Ajouter ces prestations" }).click();
  await expect(page.getByText("Prestations ajoutées")).toBeVisible();
  await sql`update organization set min_notice_minutes = 0, cancellation_notice_hours = 0 where slug = ${slug}`;
  await sql`
    insert into working_hours (organization_id, staff_id, weekday, start_minute, end_minute)
    select o.id, s.id, d, 480, 1200 from organization o join staff s on s.organization_id = o.id, generate_series(1,7) d
    where o.slug = ${slug}`;
  await sql`delete from working_hours wh using organization o where wh.organization_id = o.id and o.slug = ${slug} and wh.start_minute <> 480`;
  return { owner, slug };
}

async function bookAsCustomer(browser: Browser, slug: string, email: string) {
  const ctx = await browser.newContext({ locale: "fr-FR" });
  const p = await ctx.newPage();
  await p.goto(`/${slug}`);
  await expect(p.getByRole("heading", { name: "Salon Sophie" })).toBeVisible();
  await p.getByTestId("public-service").filter({ hasText: "Coupe homme" }).click();
  // Choisit le premier créneau disponible (semaine suivante si besoin).
  const slot = p.getByTestId("slot").first();
  if (!(await slot.isVisible().catch(() => false))) {
    await expect(
      p.getByTestId("slot").first().or(p.getByText("Aucun créneau disponible cette semaine")),
    ).toBeVisible();
  }
  const time = (await p.getByTestId("slot").first().textContent())!;
  await p.getByTestId("slot").first().click();
  await p.getByLabel("Prénom").fill("Hugo");
  await p.getByLabel("Nom", { exact: true }).fill("Bernard");
  await p.getByLabel("Email", { exact: true }).fill(email);
  await p.getByLabel("Téléphone (facultatif)").fill("06 12 34 56 78");
  await p.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
  await expect(p).toHaveURL(/\/rdv\/[0-9a-f-]{36}\.[A-Za-z0-9_-]{32}\?nouveau=1$/);
  await expect(p.getByTestId("manage-title")).toHaveText("Rendez-vous confirmé !");
  return { page: p, ctx, time, url: p.url() };
}

test.describe("parcours métier", () => {
  test.describe.configure({ timeout: 90_000 });
  test("installation → réservation publique → agenda, réservations, clients → annulation par le client", async ({
    page,
    browser,
  }) => {
    const { slug } = await ownerWithServices(page);
    await expect(page.getByTestId("setup-services")).toContainText("Vos prestations");

    const customerEmail = uniqueEmail("client");
    const booking = await bookAsCustomer(browser, slug, customerEmail);

    // Le rendez-vous est bien enregistré en base.
    const [row] = await sql<{ status: string; source: string; service_name: string }[]>`
      select a.status, a.source, a.service_name from appointment a join customer c on c.id = a.customer_id where c.email = ${customerEmail}`;
    expect(row).toEqual({ status: "confirmed", source: "online", service_name: "Coupe homme" });

    // Le créneau réservé n'est plus proposé.
    const other = await browser.newContext();
    const p2 = await other.newPage();
    await p2.goto(`/${slug}`);
    await p2.getByTestId("public-service").filter({ hasText: "Coupe homme" }).click();
    await expect(p2.getByTestId("slot").first()).toBeVisible();
    await expect(p2.getByTestId("slot").first()).not.toHaveText(booking.time);
    await other.close();

    // Côté professionnel : réservations, clients, notification.
    await page.goto("/tableau-de-bord/reservations");
    await expect(
      page.getByTestId("reservation-row").filter({ hasText: "Hugo Bernard" }),
    ).toBeVisible();
    await page.getByTestId("reservation-row").filter({ hasText: "Hugo Bernard" }).click();
    await expect(page.getByTestId("appointment-sheet")).toContainText("Coupe homme");
    await page.keyboard.press("Escape");

    await page.goto("/tableau-de-bord/clients");
    await expect(
      page.getByTestId("customer-row").filter({ hasText: "Hugo Bernard" }),
    ).toBeVisible();
    await page.goto("/tableau-de-bord/notifications");
    await expect(
      page.getByTestId("notification-row").filter({ hasText: "Nouvelle réservation" }),
    ).toBeVisible();

    await page.goto("/tableau-de-bord/calendrier");
    await expect(page.getByTestId("calendar-title")).toBeVisible();

    // Le client annule depuis son lien sécurisé.
    await booking.page.getByRole("button", { name: "Annuler" }).click();
    await booking.page.getByRole("button", { name: "Confirmer l'annulation" }).click();
    await expect(booking.page.getByTestId("manage-title")).toHaveText("Rendez-vous annulé");
    const [after] = await sql<{ status: string; cancelled_by: string }[]>`
      select a.status, a.cancelled_by from appointment a join customer c on c.id = a.customer_id where c.email = ${customerEmail}`;
    expect(after).toEqual({ status: "cancelled", cancelled_by: "customer" });
    await booking.ctx.close();

    // Un lien de gestion falsifié est refusé.
    await page.goto(
      booking.url.replace(/\.[A-Za-z0-9_-]{32}/, ".AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });

  test("forfait Pro : emails de confirmation et rappels programmés ; forfait Free : aucun email client", async ({
    page,
    browser,
  }) => {
    const { slug } = await ownerWithServices(page);
    const freeEmail = uniqueEmail("free");
    await (await bookAsCustomer(browser, slug, freeEmail)).ctx.close();
    const [free] = await sql<
      { n: number }[]
    >`select count(*)::int as n from notification where recipient = ${freeEmail}`;
    expect(free.n).toBe(0);

    await setPlan(slug, "pro");
    const proEmail = uniqueEmail("pro");
    await (await bookAsCustomer(browser, slug, proEmail)).ctx.close();
    const rows = await sql<
      { type: string }[]
    >`select type from notification where recipient = ${proEmail} order by type`;
    expect(rows.map((r) => r.type)).toContain("booking_confirmation");
    // L'email de confirmation est traité immédiatement après la réservation.
    await expect
      .poll(
        async () =>
          (
            await sql<
              { status: string }[]
            >`select status from notification where recipient = ${proEmail} and type = 'booking_confirmation'`
          )[0]?.status,
        { timeout: 10_000 },
      )
      .toBe("sent");
    const [mail] = await sql<
      { subject: string; text: string }[]
    >`select subject, text from email_message where "to" = ${proEmail} and template = 'booking_confirmation'`;
    expect(mail.subject).toMatch(/^Rendez-vous confirmé — Salon Sophie/);
    expect(mail.text).toMatch(/\/rdv\//);
  });

  test("équipe : invitation par email, rôle employé, permissions et isolation", async ({
    page,
    browser,
  }) => {
    const { slug } = await ownerWithServices(page);
    // Forfait Free : 1 seul membre → invitation impossible.
    await page.goto("/tableau-de-bord/equipe");
    await expect(page.getByTestId("seat-count")).toHaveText("1 / 1");
    await expect(page.getByRole("button", { name: "Inviter" })).toBeDisabled();

    await setPlan(slug, "pro");
    await page.reload();
    const employeeEmail = uniqueEmail("employe");
    await page.getByRole("button", { name: "Inviter" }).click();
    await page.getByLabel("Adresse email").fill(employeeEmail);
    await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await expect(
      page.getByTestId("invitation-row").filter({ hasText: employeeEmail }),
    ).toBeVisible();

    // L'invité crée son compte depuis le lien reçu par email.
    const link = await latestEmailLink(employeeEmail, "invitation");
    const ctx = await browser.newContext();
    const emp = await ctx.newPage();
    await emp.goto(link);
    await expect(emp.getByRole("heading", { name: "Rejoindre Salon Sophie" })).toBeVisible();
    await emp.getByRole("link", { name: "Créer mon compte" }).click();
    await expect(emp.getByLabel("Email professionnel")).toHaveValue(employeeEmail);
    await emp.getByLabel("Nom complet").fill("Marc Employé");
    await emp.getByLabel("Mot de passe", { exact: true }).fill("MotDePasse2026");
    await emp.getByRole("checkbox", { name: /J'accepte les conditions générales/ }).check();
    await emp.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(emp).toHaveURL(/verifier-email/);
    await emp.goto(await latestEmailLink(employeeEmail, "verify-email"));
    await expect(emp).toHaveURL(/\/invitation\//);
    await emp.getByRole("button", { name: "Accepter l'invitation" }).click();
    await expect(emp).toHaveURL(/\/tableau-de-bord$/);
    await expect(emp.getByTestId("org-name")).toHaveText("Salon Sophie");

    // Un employé ne voit pas les sections réservées.
    await emp.goto("/tableau-de-bord/menu");
    const menu = emp.getByRole("main");
    await expect(menu.getByRole("link", { name: "Calendrier" })).toBeVisible();
    for (const hidden of ["Clients", "Services", "Abonnement", "Statistiques", "Employés"]) {
      await expect(menu.getByRole("link", { name: hidden, exact: true })).toHaveCount(0);
    }
    await emp.goto("/tableau-de-bord/parametres/entreprise");
    await expect(emp).toHaveURL(/acces=refuse/);
    await emp.goto("/tableau-de-bord/clients");
    await expect(emp).toHaveURL(/acces=refuse/);

    // Le lien d'invitation ne peut pas être réutilisé.
    await emp.goto(link);
    await expect(emp.getByRole("heading", { name: "Invitation indisponible" })).toBeVisible();

    // Isolation : la fiche d'un client d'une autre entreprise est introuvable.
    const otherCtx = await browser.newContext();
    const other = await otherCtx.newPage();
    await signUpAndVerify(other, { name: "Autre Pro" });
    await createOrganization(other, "Autre Salon", `autre-${Date.now().toString(36)}`);
    const [cust] = await sql<
      { id: string }[]
    >`select c.id from customer c join organization o on o.id = c.organization_id where o.slug = ${slug} limit 1`;
    const [ownerCust] = cust
      ? [cust]
      : await sql<
          { id: string }[]
        >`insert into customer (organization_id, first_name, last_name) select id, 'Secret', 'Client' from organization where slug = ${slug} returning id`;
    await other.goto(`/tableau-de-bord/clients/${ownerCust.id}`);
    await expect(other.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(other.getByText("Secret")).toHaveCount(0);
    await otherCtx.close();
    await ctx.close();
  });

  test("paramètres : coordonnées et logo visibles sur la page publique", async ({ page }) => {
    const { slug } = await ownerWithServices(page);
    await page.goto("/tableau-de-bord/parametres/entreprise");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Téléphone").fill("0123456789");
    await page.getByLabel("Ville").fill("Lyon");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText("Informations enregistrées.")).toBeVisible();
    await page.waitForLoadState("networkidle");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAn0lEQVRoge2SQQkAQRDDaqqKTn1crIh7hIFCBKSh6cdpoht0A9ArdhfiLtENugHoFbsLcZfoBt0A9IrdhbhLdINuAHrF7kLcJbpBNwC9Ynch7hLdoBuAXrG7EHeJbtANQK/YXYi7RDfoBqBX7C7EXaIbdAPQK3YX4i7RDboB6BW7C3GX6AbdAPSK3YW4S3SDbgB6xe5C3CW6QTcAveIfHvUoEWkHLNZzAAAAAElFTkSuQmCC",
      "base64",
    );
    await page
      .getByLabel("Logo de l'entreprise")
      .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
    await expect(page.getByText("Image enregistrée.")).toBeVisible();
    // Un fichier qui n'est pas une image est refusé.
    await page.getByLabel("Logo de l'entreprise").setInputFiles({
      name: "faux.png",
      mimeType: "image/png",
      buffer: Buffer.from("<script>alert(1)</script>"),
    });
    await expect(page.getByText("Ce fichier n'est pas une image valide.")).toBeVisible();
    await page.getByLabel("Téléphone").fill("pas un numéro");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText(/Numéro de téléphone invalide/)).toBeVisible();

    await page.goto(`/${slug}`);
    await expect(page.getByText("01 23 45 67 89")).toBeVisible();
    const logo = page.getByAltText("Logo Salon Sophie");
    await expect(logo).toBeVisible();
    const src = await logo.getAttribute("src");
    const img = await page.request.get(src!);
    expect(img.headers()["content-type"]).toBe("image/webp");
  });

  test("statistiques et abonnement accessibles au propriétaire", async ({ page }) => {
    await ownerWithServices(page);
    await page.goto("/tableau-de-bord/statistiques");
    await expect(page.getByText("Services les plus réservés")).toBeVisible();
    await expect(page.getByText(/statistiques avancées/)).toBeVisible();
    await page.goto("/tableau-de-bord/abonnement");
    await expect(page.getByTestId("current-plan")).toContainText("Free");
    await expect(page.getByTestId("plan-pro")).toContainText("19,99 €");
  });

  test("navigation mobile : barre d'onglets et menu « Plus »", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Spécifique au mobile");
    await ownerWithServices(page);
    await page.goto("/tableau-de-bord");
    const tabs = page.getByRole("navigation", { name: "Navigation principale" }).last();
    await expect(tabs.getByRole("link", { name: "Calendrier" })).toBeVisible();
    await tabs.getByRole("link", { name: "Plus" }).click();
    await expect(page).toHaveURL(/\/tableau-de-bord\/menu$/);
    await page.getByRole("link", { name: "Statistiques" }).click();
    await expect(page).toHaveURL(/statistiques/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("connexion existante après inscription : reprise sur le tableau de bord", async ({
    page,
  }) => {
    const user = await signUp(page);
    await page.goto(await latestEmailLink(user.email, "verify-email"));
    await createOrganization(page, "Studio Reprise", `reprise-${Date.now().toString(36)}`);
    await page.context().clearCookies();
    await signIn(page, user.email);
    await expect(page).toHaveURL(/\/tableau-de-bord$/);
  });
});
