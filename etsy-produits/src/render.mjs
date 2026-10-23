// Rend build/*.html en PDF (../produits) et en aperçus PNG de chaque page (build/previews).
// Usage : node render.mjs
import { createRequire } from "node:module";
import { readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/node22/lib/node_modules/playwright");
}

const here = dirname(fileURLToPath(import.meta.url));
const build = join(here, "build");
const out = join(here, "..", "produits");
const previews = join(build, "previews");
mkdirSync(out, { recursive: true });
mkdirSync(previews, { recursive: true });

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });

for (const file of readdirSync(build).filter((f) => f.endsWith(".html"))) {
  const slug = file.replace(/\.html$/, "");
  await page.goto(pathToFileURL(join(build, file)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: join(out, `${slug}.pdf`), format: "A4", printBackground: true, preferCSSPageSize: true });
  const sections = await page.$$("section.page");
  for (let i = 0; i < sections.length; i++) {
    await sections[i].screenshot({ path: join(previews, `${slug}-${String(i + 1).padStart(2, "0")}.png`) });
  }
  console.log(`ok ${slug} (${sections.length} pages)`);
}

await browser.close();
