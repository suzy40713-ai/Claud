import postgres from "postgres";
import { expect, type Page } from "@playwright/test";

const url = process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/booksync_dev";
export const sql = postgres(url, { max: 2, onnotice: () => {} });

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export const PASSWORD = "MotDePasse2026";

/** Dernier lien reçu par email pour ce destinataire (les emails sont journalisés en base). */
export async function latestEmailLink(to: string, template: string, after = new Date(0)) {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const rows = await sql<{ text: string }[]>`
          select text from email_message
          where "to" = ${to} and template = ${template} and created_at > ${after}
          order by created_at desc limit 1`;
        link = rows[0]?.text.match(/https?:\/\/\S+/)?.[0];
        return link;
      },
      { timeout: 10_000, message: `email « ${template} » pour ${to}` },
    )
    .toBeTruthy();
  return link!;
}

export async function countEmails(to: string, template: string) {
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n from email_message where "to" = ${to} and template = ${template}`;
  return row.n;
}

export async function signUp(
  page: Page,
  { name = "Camille Martin", email = uniqueEmail(), password = PASSWORD } = {},
) {
  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill(name);
  await page.getByLabel("Email professionnel").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/verifier-email\?email=/);
  return { name, email, password };
}

/** Inscription + confirmation de l'email : l'utilisateur arrive connecté sur l'onboarding. */
export async function signUpAndVerify(page: Page, opts?: Parameters<typeof signUp>[1]) {
  const user = await signUp(page, opts);
  await page.goto(await latestEmailLink(user.email, "verify-email"));
  await expect(page).toHaveURL(/\/onboarding$/);
  return user;
}

export async function createOrganization(page: Page, name: string, slug?: string) {
  await page.getByLabel("Nom de l'entreprise").fill(name);
  if (slug) await page.getByLabel("Adresse de votre page de réservation").fill(slug);
  await page.getByRole("button", { name: "Créer mon entreprise" }).click();
  await expect(page).toHaveURL(/\/tableau-de-bord$/);
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}
