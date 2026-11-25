import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { sql } from "./helpers";
import { sampleArticle } from "../fixtures/blog";

test("blog : liste, article lisible, plan du site, agent protégé", async ({ page, request }) => {
  const slug = `e2e-article-${randomUUID().slice(0, 8)}`;
  const a = sampleArticle({ title: "Quoi vendre quand on débute : guide e2e" });
  await sql`insert into blog_post (slug, keyword, title, description, content, model)
    values (${slug}, ${slug}, ${a.title}, ${a.metaDescription}, ${sql.json(a)}, 'groq:test')`;

  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1, name: "Vendre quand on débute" })).toBeVisible();
  await page.locator(`a[href="/blog/${slug}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/blog/${slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(a.title);
  await expect(page.getByRole("heading", { name: "Questions fréquentes" })).toBeVisible();
  await expect(page.getByText("min de lecture")).toBeVisible();
  await expect(page.getByRole("link", { name: "Trouver mon idée en 2 minutes" })).toHaveAttribute(
    "href",
    "/lancer-mon-activite",
  );
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`/blog/${slug}`);

  await page.goto("/blog/article-qui-n-existe-pas");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();

  expect((await request.post("/api/cron/blog")).status()).toBe(401);
  await sql`delete from blog_post where slug = ${slug}`;
});
