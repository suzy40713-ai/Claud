// Crée les images d'annonce Etsy (2400×1800, format 4:3) à partir des aperçus de pages.
// Usage : node mockups.mjs  (après render.mjs)
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
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
const previews = join(here, "build", "previews");
const out = join(here, "..", "images-etsy");
mkdirSync(out, { recursive: true });

const products = [
  { slug: "planner-budget-2027", title: "Planner budget 2027", pages: 18, sub: "Gérez votre argent mois par mois", show: [1, 4, 17] },
  { slug: "agenda-mensuel-2027", title: "Agenda mensuel 2027", pages: 16, sub: "Jours fériés français inclus", show: [1, 2, 6] },
  { slug: "menus-et-courses", title: "Menus & liste de courses", pages: 6, sub: "Planifiez la semaine en 10 minutes", show: [1, 2, 3] },
  { slug: "suivi-habitudes", title: "Suivi d'habitudes", pages: 5, sub: "Tracker, routines et année en pixels", show: [1, 2, 4] },
  { slug: "planning-menage", title: "Planning ménage", pages: 5, sub: "Une pièce par jour, sans y passer le week-end", show: [1, 2, 3] },
];

const img = (slug, n) => pathToFileURL(join(previews, `${slug}-${String(n).padStart(2, "0")}.png`)).href;
const fonts = pathToFileURL(join(here, "fonts")).href;

const css = `
@font-face { font-family: "Fraunces"; src: url("${fonts}/Fraunces.woff2"); font-weight: 100 900; }
@font-face { font-family: "Karla"; src: url("${fonts}/Karla.woff2"); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; }
body { width: 2400px; height: 1800px; overflow: hidden; background: #e7ece9; font-family: "Karla", sans-serif; color: #2b2d2c; }
.wrap { position: relative; width: 100%; height: 100%; padding: 130px 120px; display: grid; grid-template-columns: 880px 1fr; gap: 60px; align-items: center; }
.text { display: grid; gap: 40px; z-index: 2; }
.eyebrow { font-weight: 700; font-size: 34px; letter-spacing: .18em; text-transform: uppercase; color: #3d6b66; }
h1 { font-family: "Fraunces", serif; font-weight: 600; font-size: 132px; line-height: .98; letter-spacing: -.02em; }
.sub { font-size: 46px; color: #57605c; line-height: 1.3; }
.badges { display: flex; flex-wrap: wrap; gap: 18px; }
.badges span { background: #fff; border-radius: 999px; padding: 18px 32px; font-size: 34px; font-weight: 700; }
.badges span.hl { background: #3d6b66; color: #fff; }
.stack { position: relative; height: 100%; }
.stack img { position: absolute; width: 720px; border-radius: 10px; box-shadow: 0 30px 70px rgba(30,45,40,.22), 0 4px 12px rgba(30,45,40,.12); background: #fff; }
.stack img:nth-child(1) { left: 0; top: 230px; transform: rotate(-6deg); }
.stack img:nth-child(2) { left: 330px; top: 120px; transform: rotate(3deg); }
.stack img:nth-child(3) { left: 600px; top: 330px; transform: rotate(-1deg); width: 640px; }
.circle { position: absolute; width: 1300px; height: 1300px; border-radius: 50%; border: 150px solid rgba(61,107,102,.08); right: -420px; top: -520px; }
.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 34px; }
.grid img { width: 100%; border-radius: 8px; box-shadow: 0 20px 50px rgba(30,45,40,.18); }
`;

function productHtml(p) {
  const imgs = p.show.map((n) => `<img src="${img(p.slug, n)}">`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="wrap"><div class="circle"></div>
<div class="text"><div class="eyebrow">À imprimer · En français</div><h1>${p.title}</h1><div class="sub">${p.sub}</div>
<div class="badges"><span class="hl">${p.pages} pages</span><span>PDF A4</span><span>Téléchargement immédiat</span></div></div>
<div class="stack">${imgs}</div></div></body></html>`;
}

function bundleHtml() {
  const covers = products.map((p) => `<img src="${img(p.slug, 1)}">`).join("");
  const total = products.reduce((s, p) => s + p.pages, 0);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}
.b { padding: 120px; display: grid; gap: 70px; height: 100%; align-content: center; }
.b h1 { font-size: 120px; } .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; }
</style></head><body><div class="b"><div class="circle"></div>
<div class="head"><div class="text"><div class="eyebrow">Le pack complet · À imprimer</div><h1>Organisation 2027</h1></div>
<div class="badges"><span class="hl">5 planners</span><span>${total} pages</span><span>PDF A4</span></div></div>
<div class="grid">${covers}</div>
<div class="sub">Budget · Agenda · Menus & courses · Habitudes · Ménage</div></div></body></html>`;
}

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 1800 } });
const jobs = products.map((p) => [p.slug, productHtml(p)]).concat([["pack-complet", bundleHtml()]]);
for (const [name, html] of jobs) {
  const file = join(here, "build", `mockup-${name}.html`);
  writeFileSync(file, html);
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `${name}.jpg`), type: "jpeg", quality: 88 });
  console.log("ok", name);
}
await browser.close();
