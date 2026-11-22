import { expect, test } from "@playwright/test";
import { signUpAndVerify } from "./helpers";

test("lance ton activité : plan personnalisé puis page pré-remplie à l'inscription", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Lance ton activité" }).click();
  await expect(page).toHaveURL(/\/lancer-mon-activite$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lance ton activité.");

  await page.getByLabel("Ton métier").selectOption("tresses");
  await page.getByLabel("Ton prénom").fill("Awa");
  await page.getByLabel("Ta ville").fill("Lille");
  const plan = page.getByTestId("launch-plan");
  await expect(plan.getByRole("button", { name: "Awa Braids", exact: true })).toBeVisible();
  await expect(page.getByTestId("launch-services")).toContainText("Box braids");
  await expect(page.getByTestId("launch-bio")).toContainText("Tresseuse à domicile · Lille");
  await expect(plan.getByRole("link", { name: /formalites\.entreprises\.gouv\.fr/ })).toBeVisible();

  await plan.getByRole("button", { name: "Lille Braids" }).click();
  const cta = page.getByRole("link", { name: /Créer ma page gratuite/ });
  await expect(cta).toHaveAttribute("href", /\/inscription\?pro=1&redirection=/);
  const href = (await cta.getAttribute("href"))!;
  const next = new URL(href, "http://x").searchParams.get("redirection")!;
  expect(next).toBe("/onboarding?nom=Lille%20Braids&activite=tresses");

  // Après l'inscription, la création de l'entreprise reprend le nom et le métier choisis.
  await signUpAndVerify(page, { name: "Awa Diallo" });
  await page.goto(next);
  await expect(page.getByLabel("Nom de l'entreprise")).toHaveValue("Lille Braids");
  await expect(page.getByLabel("Votre activité")).toHaveValue("tresses");
  await expect(page.getByLabel(/Adresse de votre page/)).toHaveValue("lille-braids");
});
