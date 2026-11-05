import { expect, test } from "@playwright/test";
import {
  countEmails,
  createOrganization,
  latestEmailLink,
  PASSWORD,
  signIn,
  signUp,
  signUpAndVerify,
  sql,
  uniqueEmail,
} from "./helpers";

test.afterAll(() => sql.end());

test.describe("inscription et entreprise", () => {
  test("parcours complet : inscription → confirmation → entreprise → tableau de bord → déconnexion → connexion", async ({
    page,
  }) => {
    const user = await signUp(page, { name: "Camille Martin" });
    await expect(page.getByText(user.email)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vérifiez votre boîte mail" })).toBeVisible();

    // Le lien de l'email connecte automatiquement l'utilisateur.
    await page.goto(await latestEmailLink(user.email, "verify-email"));
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByText("Bienvenue Camille")).toBeVisible();

    // L'adresse publique est suggérée à partir du nom (accents supprimés).
    const suffix = Date.now().toString(36);
    await page.getByLabel("Nom de l'entreprise").fill(`Clinique Vétérinaire Éloïse ${suffix}`);
    await expect(page.getByLabel("Adresse de votre page de réservation")).toHaveValue(
      `clinique-veterinaire-eloise-${suffix}`,
    );
    await page.getByRole("button", { name: "Créer mon entreprise" }).click();

    await expect(page).toHaveURL(/\/tableau-de-bord$/);
    await expect(page.getByRole("heading", { name: "Bonjour Camille" })).toBeVisible();
    await expect(page.getByTestId("org-name")).toHaveText(`Clinique Vétérinaire Éloïse ${suffix}`);
    await expect(page.getByText("Propriétaire")).toBeVisible();
    await expect(page.getByText(`/clinique-veterinaire-eloise-${suffix}`)).toBeVisible();

    // L'entreprise et l'appartenance sont bien en base.
    const [row] = await sql<{ role: string; timezone: string }[]>`
      select m.role, o.timezone from member m
      join organization o on o.id = m.organization_id
      join "user" u on u.id = m.user_id where u.email = ${user.email}`;
    expect(row).toEqual({ role: "owner", timezone: "Europe/Paris" });

    // Déconnexion
    await page.getByRole("button", { name: "Menu du compte" }).click();
    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/connexion$/);
    await page.goto("/tableau-de-bord");
    await expect(page).toHaveURL(/\/connexion/);

    // Reconnexion : l'entreprise est réactivée automatiquement.
    await signIn(page, user.email);
    await expect(page).toHaveURL(/\/tableau-de-bord$/);
    await expect(page.getByTestId("org-name")).toHaveText(`Clinique Vétérinaire Éloïse ${suffix}`);
  });

  test("les erreurs de saisie sont affichées en français", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("Indiquez votre nom (2 caractères minimum).")).toBeVisible();
    await expect(page.getByText("Indiquez votre adresse email.")).toBeVisible();
    await page.getByLabel("Email professionnel").fill("pas-un-email");
    await page.getByLabel("Mot de passe", { exact: true }).fill("court");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("Adresse email invalide.")).toBeVisible();
    await expect(
      page.getByText("Le mot de passe doit contenir au moins 10 caractères."),
    ).toBeVisible();
    await expect(page.getByLabel("Email professionnel")).toHaveAttribute("aria-invalid", "true");
  });

  test("une adresse email déjà utilisée : même réponse, titulaire prévenu, pas de second compte", async ({
    page,
  }) => {
    const user = await signUpAndVerify(page);
    await page.context().clearCookies();
    await signUp(page, {
      name: "Autre Personne",
      email: user.email.toUpperCase(),
      password: "AutreMotDePasse99",
    });
    // Aucune information n'est révélée à la personne qui s'inscrit…
    await expect(page.getByRole("heading", { name: "Vérifiez votre boîte mail" })).toBeVisible();
    // …mais le titulaire du compte reçoit un email l'informant de la tentative.
    await expect.poll(() => countEmails(user.email, "existing-account")).toBe(1);
    const [row] = await sql<
      { n: number }[]
    >`select count(*)::int as n from "user" where email = ${user.email}`;
    expect(row.n).toBe(1);
    // L'ancien mot de passe reste le seul valable.
    await signIn(page, user.email, "AutreMotDePasse99");
    await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();
  });

  test("l'adresse publique doit être disponible et non réservée", async ({ page }) => {
    const first = await signUpAndVerify(page);
    const slug = `cabinet-${Date.now().toString(36)}`;
    await createOrganization(page, "Cabinet Un", slug);
    expect(first.email).toBeTruthy();

    await page.context().clearCookies();
    await signUpAndVerify(page);
    const slugInput = page.getByLabel("Adresse de votre page de réservation");
    await page.getByLabel("Nom de l'entreprise").fill("Cabinet Deux");
    await slugInput.fill(slug);
    await expect(
      page.getByText("Cette adresse est déjà utilisée par une autre entreprise."),
    ).toBeVisible();
    await slugInput.fill("connexion");
    await expect(
      page.getByText("Cette adresse est réservée. Choisissez-en une autre."),
    ).toBeVisible();
    // Même en forçant l'envoi, le serveur refuse.
    await page.getByRole("button", { name: "Créer mon entreprise" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(
      page.getByText("Cette adresse est réservée. Choisissez-en une autre."),
    ).toBeVisible();
  });
});

test.describe("connexion", () => {
  test("mauvais mot de passe : message clair, pas de connexion", async ({ page }) => {
    const user = await signUpAndVerify(page);
    await page.context().clearCookies();
    await signIn(page, user.email, "MauvaisMotDePasse1");
    await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("compte non confirmé : connexion refusée et nouveau lien envoyé", async ({ page }) => {
    const user = await signUp(page);
    expect(await countEmails(user.email, "verify-email")).toBe(1);
    await signIn(page, user.email);
    await expect(page).toHaveURL(/\/verifier-email\?email=.*renvoye=1/);
    await expect(page.getByText("nous venons de vous renvoyer le lien")).toBeVisible();
    await expect.poll(() => countEmails(user.email, "verify-email")).toBe(2);
  });

  test("un lien de confirmation invalide affiche une erreur", async ({ page }) => {
    await page.goto("/api/auth/verify-email?token=invalide&callbackURL=/verifier-email/confirme");
    await expect(page.getByRole("heading", { name: "Lien invalide" })).toBeVisible();
  });

  test("les pages privées redirigent vers la connexion, puis vers la page demandée", async ({
    page,
  }) => {
    const user = await signUpAndVerify(page);
    await createOrganization(page, "Studio Redirection", `studio-${Date.now().toString(36)}`);
    await page.context().clearCookies();

    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/connexion\?redirection=%2Fonboarding$/);
    await page.goto("/tableau-de-bord");
    await expect(page).toHaveURL(/\/connexion$/);

    await signIn(page, user.email);
    await expect(page).toHaveURL(/\/tableau-de-bord$/);
    // Déjà connecté : les pages d'authentification renvoient vers le tableau de bord.
    await page.goto("/connexion");
    await expect(page).toHaveURL(/\/tableau-de-bord$/);
  });

  test("une redirection externe est ignorée", async ({ page }) => {
    const user = await signUpAndVerify(page);
    await createOrganization(page, "Studio Sécurité", `secu-${Date.now().toString(36)}`);
    await page.context().clearCookies();
    await page.goto("/connexion?redirection=//evil.example.com");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/localhost:\d+\/tableau-de-bord$/);
  });
});

test.describe("mot de passe oublié", () => {
  test("réinitialisation complète, ancien mot de passe refusé, lien à usage unique", async ({
    page,
  }) => {
    const user = await signUpAndVerify(page);
    await createOrganization(page, "Atelier Reset", `atelier-${Date.now().toString(36)}`);
    await page.context().clearCookies();

    const before = new Date();
    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(page.getByText("vous allez recevoir un lien de réinitialisation")).toBeVisible();

    const link = await latestEmailLink(user.email, "reset-password", before);
    await page.goto(link);
    await expect(page).toHaveURL(/\/reinitialiser-mot-de-passe\?token=/);
    const resetUrl = page.url();

    await page.getByLabel("Nouveau mot de passe").fill("NouveauSecret2027");
    await page.getByLabel("Confirmer le mot de passe").fill("Different2027");
    await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
    await expect(page.getByText("Les deux mots de passe ne correspondent pas.")).toBeVisible();

    await page.getByLabel("Confirmer le mot de passe").fill("NouveauSecret2027");
    await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
    await expect(page).toHaveURL(/\/connexion\?reinitialise=1$/);
    await expect(page.getByText("Votre mot de passe a été modifié.")).toBeVisible();

    await signIn(page, user.email, PASSWORD);
    await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();
    await signIn(page, user.email, "NouveauSecret2027");
    await expect(page).toHaveURL(/\/tableau-de-bord$/);

    // Le lien ne peut pas être réutilisé.
    await page.context().clearCookies();
    await page.goto(resetUrl);
    await page.getByLabel("Nouveau mot de passe").fill("EncoreUnAutre2028");
    await page.getByLabel("Confirmer le mot de passe").fill("EncoreUnAutre2028");
    await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
    await expect(page.getByText(/Ce lien n'est plus valide|Ce lien a expiré/)).toBeVisible();
  });

  test("une adresse inconnue reçoit la même réponse (pas de fuite d'information)", async ({
    page,
  }) => {
    const email = uniqueEmail("inconnu");
    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(page.getByText("vous allez recevoir un lien de réinitialisation")).toBeVisible();
    expect(await countEmails(email, "reset-password")).toBe(0);
  });
});
