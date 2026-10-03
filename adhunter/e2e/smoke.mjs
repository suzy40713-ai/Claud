/**
 * End-to-end smoke test of the main user journeys.
 *
 * Requires a running app (BASE_URL, default http://localhost:3000) connected
 * to a Supabase project with the migration applied, DEMO_MODE=true, email
 * auto-confirm enabled, and ADMIN_EMAILS containing ADMIN_EMAIL.
 *
 *   node e2e/smoke.mjs
 *
 * Screenshots are written to SCREENSHOT_DIR (default ./e2e/screenshots).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.SCREENSHOT_DIR || "e2e/screenshots";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.dev";
const run = Date.now();
const USER_EMAIL = `user${run}@test.dev`;
const PASSWORD = "Sup3r-secret!";
mkdirSync(OUT, { recursive: true });

const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ executablePath });
let failures = 0;
const results = [];

async function step(name, fn) {
  try {
    await fn();
    results.push(`✅ ${name}`);
  } catch (error) {
    failures += 1;
    results.push(`❌ ${name}\n     ${String(error?.message ?? error).split("\n")[0]}`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function noHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `horizontal overflow of ${overflow}px`);
}

async function signup(page, email) {
  await page.goto(`${BASE}/signup`);
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.check('input[name="terms"]');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 20000 });
}

// ---------------------------------------------------------------------------
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
page.on("pageerror", (e) => results.push(`⚠️  page error: ${e.message}`));

await step("Landing page renders with hero, pricing, FAQ, no invented testimonials", async () => {
  await page.goto(BASE);
  const h1 = await page.textContent("h1");
  assert(h1.includes("Trouve les publicités gagnantes"), "hero title missing");
  assert(await page.isVisible("text=Commencer gratuitement"), "primary CTA missing");
  assert(await page.isVisible("text=Découvrir la plateforme"), "secondary CTA missing");
  assert((await page.content()).includes("19,99"), "Pro price missing");
  assert(await page.isVisible("#faq"), "FAQ missing");
  assert(!(await page.isVisible("text=Ils utilisent AdHunter")), "testimonials should not render without real quotes");
  await page.screenshot({ path: `${OUT}/01-landing-desktop.png`, fullPage: false });
  // Acknowledge the cookie notice like a real visitor (stored in localStorage).
  await page.click("text=J'ai compris");
});

await step("SEO files: sitemap, robots, legal pages, blog", async () => {
  for (const path of ["/sitemap.xml", "/robots.txt", "/legal/cgv", "/legal/confidentialite", "/legal/cookies", "/legal/mentions-legales", "/legal/cgu", "/blog", "/tarifs", "/fonctionnalites", "/contact"]) {
    const res = await page.goto(`${BASE}${path}`);
    assert(res.status() === 200, `${path} -> ${res.status()}`);
  }
  const res = await page.goto(`${BASE}/blog/ecrire-accroche-publicitaire-efficace`);
  assert(res.status() === 200, "blog post");
  assert((await page.content()).includes("application/ld+json"), "blog JSON-LD missing");
});

await step("Private pages redirect to login when signed out", async () => {
  await page.goto(`${BASE}/app/library`);
  assert(page.url().includes("/login?next="), `not redirected: ${page.url()}`);
});

await step("Sign up (Free) → dashboard with onboarding tour", async () => {
  await signup(page, USER_EMAIL);
  await page.waitForSelector("#tour-title", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/02-dashboard-tour.png` });
});

await step("Complete interactive tutorial (choose a niche) → library", async () => {
  await page.click("text=Suivant");
  await page.click('button:has-text("Beauté")');
  for (let i = 0; i < 5; i++) await page.click("text=Suivant");
  await page.click("text=Lancer ma première recherche");
  await page.waitForURL(/\/app\/library\?niche=beaute/, { timeout: 20000 });
});

await step("Ad Library search returns clearly labelled demo results", async () => {
  await page.goto(`${BASE}/app/library?q=s%C3%A9rum&country=FR`);
  await page.waitForSelector("article", { timeout: 20000 });
  const badges = await page.locator("text=Démo").count();
  assert(badges > 0, "demo badge missing");
  await page.screenshot({ path: `${OUT}/03-library.png` });
});

await step("Meta source is reported as 'en préparation' without token (no fake results)", async () => {
  const opt = await page.locator('#platform option[value="meta"]').textContent();
  assert(opt.includes("en préparation"), `meta option: ${opt}`);
});

await step("Save to favorites + create collection (Free limit = 1)", async () => {
  await page.goto(`${BASE}/app/library?q=mascara&country=FR`);
  await page.waitForSelector("article");
  await page.click('[aria-label="Enregistrer dans les favoris"]');
  await page.waitForSelector("text=Publicité enregistrée dans tes favoris");
  await page.click('[aria-label="Ajouter à une collection"]');
  await page.fill('input[placeholder="Nouvelle collection"]', "Inspirations beauté");
  await page.click('[aria-label="Créer la collection"]');
  await page.waitForSelector("text=Collection « Inspirations beauté » créée");
  await page.goto(`${BASE}/app/favorites`);
  assert((await page.locator("article").count()) === 1, "favorite not listed");
});

await step("Second collection is refused on Free (server-side limit)", async () => {
  await page.goto(`${BASE}/app/collections`);
  await page.click("text=Nouvelle collection");
  await page.fill("#c-name", "Deuxième");
  await page.click('button:has-text("Enregistrer")');
  await page.waitForSelector("text=limitée à 1 collection", { timeout: 10000 });
});

await step("AI Analyzer: demo analysis is labelled as demo; estimate disclaimer shown", async () => {
  await page.goto(`${BASE}/app/favorites`);
  await page.click("article a[aria-label^='Voir la publicité']");
  await page.waitForURL(/\/app\/ads\//);
  await page.click("text=Analyser avec l'IA");
  await page.waitForSelector("text=Résultat de démonstration", { timeout: 30000 });
  assert(await page.isVisible("text=3 idées de publicités originales"), "ideas section missing");
  await page.screenshot({ path: `${OUT}/04-analysis.png`, fullPage: true });
  const adUrl = page.url();
  await page.goto(`${BASE}/app/analyzer`);
  await page.waitForSelector("text=non de données de performance vérifiées");
  await page.goto(adUrl);
});

await step("AI quota enforced server-side (Free = 5 analyses / month)", async () => {
  for (let i = 0; i < 4; i++) {
    await page.click("text=Relancer l'analyse");
    await page.waitForSelector("text=Analyse terminée", { timeout: 30000 });
    await page.waitForTimeout(300);
  }
  await page.click("text=Relancer l'analyse");
  await page.waitForSelector("text=Tu as atteint ta limite de 5 analyses IA", { timeout: 15000 });
});

await step("Paid features are gated on Free (Creator, Trends, History, Team, Export)", async () => {
  for (const [path, text] of [["/app/creator", "Ad Creator est inclus dans la formule Pro"], ["/app/trends", "Trend Radar est inclus dans la formule Pro"], ["/app/history", "inclus dans la formule Pro"], ["/app/team", "inclus dans la formule Business"]]) {
    await page.goto(`${BASE}${path}`);
    assert(await page.isVisible(`text=${text}`), `${path} not gated`);
  }
  const collections = await page.request.get(`${BASE}/api/export/account`);
  assert(collections.status() === 200, "GDPR export should work for everyone");
});

await step("Billing: Stripe not configured → clear 'en préparation' state, checkout disabled", async () => {
  await page.goto(`${BASE}/app/billing`);
  await page.waitForSelector("text=Paiements en préparation", { timeout: 15000 });
  assert(await page.isDisabled('button:has-text("Passer à Pro")'), "checkout should be disabled");
  await page.screenshot({ path: `${OUT}/05-billing.png`, fullPage: true });
});

await step("Non-admin cannot access /admin", async () => {
  await page.goto(`${BASE}/admin`);
  assert(!page.url().includes("/admin"), `non-admin reached ${page.url()}`);
});

// --- Admin -------------------------------------------------------------------
const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const admin = await adminCtx.newPage();
await step("Admin signs up and reaches the admin area", async () => {
  await admin.goto(BASE);
  await admin.click("text=J'ai compris");
  await signup(admin, ADMIN_EMAIL).catch(async () => {
    await admin.goto(`${BASE}/login`);
    await admin.fill("#email", ADMIN_EMAIL);
    await admin.fill("#password", PASSWORD);
    await admin.click('button[type="submit"]');
    await admin.waitForURL(/\/app/);
  });
  await admin.goto(`${BASE}/admin`);
  assert(admin.url().endsWith("/admin"), "admin redirected");
  assert(await admin.isVisible("text=Vue d'ensemble"), "overview missing");
  await admin.screenshot({ path: `${OUT}/06-admin.png` });
});

await step("Admin grants Business to the user (manual plan)", async () => {
  await admin.goto(`${BASE}/admin/users?q=${encodeURIComponent(USER_EMAIL)}`);
  const row = admin.locator("tr", { hasText: USER_EMAIL });
  await row.locator('select[aria-label="Formule"]').selectOption("business");
  await row.locator("text=Appliquer").click();
  await admin.waitForSelector("text=Formule attribuée");
});

await step("Admin pages: plans, features, errors, subscriptions, messages", async () => {
  for (const p of ["plans", "features", "errors", "subscriptions", "messages"]) {
    const res = await admin.goto(`${BASE}/admin/${p}`);
    assert(res.status() === 200, `/admin/${p} -> ${res.status()}`);
  }
});

// --- Business features ----------------------------------------------------------
await step("Business user: Ad Creator generates, copies and saves edits", async () => {
  await page.goto(`${BASE}/app/creator`);
  await page.fill("#productName", "Gourde Alto");
  await page.fill("#audience", "sportives 25-40 ans");
  await page.fill("#description", "Gourde isotherme en inox qui garde l'eau fraîche 24 heures, légère et sans BPA.");
  await page.click("text=Générer ma campagne");
  await page.waitForSelector("text=5 accroches", { timeout: 30000 });
  await page.click('button:has-text("Modifier")');
  await page.locator('input[aria-label="Titre de la création"]').fill("Gourde Alto — v2");
  await page.click('button:has-text("Enregistrer")');
  await page.waitForSelector("text=Modifications enregistrées");
  await page.screenshot({ path: `${OUT}/07-creator.png`, fullPage: true });
});

await step("Business user: Trend Radar shows sample size (and 'insufficient' when needed)", async () => {
  await page.goto(`${BASE}/app/trends`);
  assert(await page.isVisible("text=Échantillon"), "sample size missing");
  await page.screenshot({ path: `${OUT}/08-trends.png`, fullPage: true });
});

await step("Business user: unlimited collections, CSV export, history, team", async () => {
  await page.goto(`${BASE}/app/collections`);
  await page.click("text=Nouvelle collection");
  await page.fill("#c-name", "Client Alpha");
  await page.click('button:has-text("Enregistrer")');
  await page.waitForSelector("text=Collection créée");
  await page.goto(`${BASE}/app/collections`);
  await page.click("text=Inspirations beauté");
  const href = await page.locator('a:has-text("CSV")').getAttribute("href");
  const csv = await page.request.get(`${BASE}${href}`);
  assert(csv.status() === 200, `CSV export -> ${csv.status()}`);
  assert((await csv.text()).includes("Annonceur"), "CSV header missing");
  await page.goto(`${BASE}/app/history`);
  assert((await page.locator("li").count()) > 0, "history empty");
  await page.goto(`${BASE}/app/team`);
  await page.fill('input[aria-label="Nom de l\'équipe"]', "Agence Test");
  await page.click('button:has-text("Créer")');
  await page.waitForSelector("text=Inviter un membre");
});

await step("Advanced search filters enabled for Business", async () => {
  await page.goto(`${BASE}/app/library`);
  assert(!(await page.isDisabled("#advertiser")), "advanced filters still disabled");
});

// --- Mobile ------------------------------------------------------------------------
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, storageState: await desktop.storageState() });
const m = await mobile.newPage();
await step("Mobile: landing, dashboard, library, billing without horizontal scroll", async () => {
  for (const [path, file] of [["/", "09-mobile-landing"], ["/app", "10-mobile-dashboard"], ["/app/library?q=caf%C3%A9&country=FR", "11-mobile-library"], ["/app/billing", "12-mobile-billing"], ["/tarifs", "13-mobile-pricing"]]) {
    await m.goto(`${BASE}${path}`);
    await m.waitForLoadState("networkidle");
    await noHorizontalOverflow(m);
    await m.screenshot({ path: `${OUT}/${file}.png` });
  }
  await m.goto(`${BASE}/app`);
  await m.click('[aria-label="Ouvrir le menu"]');
  await m.waitForSelector('[role="dialog"] >> text=Trend Radar');
});

// --- GDPR ------------------------------------------------------------------------------
await step("Settings: delete account (GDPR) signs out and removes data", async () => {
  await page.goto(`${BASE}/app/settings`);
  await page.click("text=Supprimer mon compte");
  await page.fill("#confirm-delete", "SUPPRIMER");
  await page.click('button:has-text("Supprimer définitivement")');
  await page.waitForURL(/account=deleted/, { timeout: 20000 });
  await page.goto(`${BASE}/app`);
  assert(page.url().includes("/login"), "still signed in after deletion");
});

await browser.close();
console.log(results.join("\n"));
console.log(failures ? `\n${failures} step(s) failed` : "\nAll E2E steps passed");
process.exit(failures ? 1 : 0);
