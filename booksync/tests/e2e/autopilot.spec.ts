import { expect, test } from "@playwright/test";
import { createOrganization, setPlan, signUpAndVerify } from "./helpers";

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
