// Capture chaque design en PNG transparent (4500 px de large, 300 DPI) dans ../designs/<variante>/,
// puis crée des aperçus sur pull dans ../apercus/.
// Usage : python3 designs.py && node render.mjs
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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
const designsDir = join(here, "..", "designs");
const previewsDir = join(here, "..", "apercus");
mkdirSync(previewsDir, { recursive: true });

// Inscrit 300 DPI dans le PNG (chunk pHYs) pour que Printify lise la bonne résolution.
function setDpi(buf, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(ppm, 0);
  data.writeUInt32BE(ppm, 4);
  data[8] = 1;
  const type = Buffer.from("pHYs");
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  let crc = 0xffffffff;
  for (const b of Buffer.concat([type, data])) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  const chunk = Buffer.alloc(21);
  chunk.writeUInt32BE(9, 0);
  type.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 17);
  // Insère juste après IHDR (8 octets de signature + 25 octets d'IHDR).
  return Buffer.concat([buf.subarray(0, 33), chunk, buf.subarray(33)]);
}

const browser = await playwright.chromium.launch();
const shots = {};
for (const file of readdirSync(build).filter((f) => f.endsWith(".html") && !f.startsWith("apercu"))) {
  const variant = file.replace(/\.html$/, "");
  const outDir = join(designsDir, variant);
  mkdirSync(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 5 });
  await page.goto(pathToFileURL(join(build, file)).href);
  await page.evaluate(() => document.fonts.ready);
  for (const el of await page.$$(".design")) {
    const id = await el.getAttribute("id");
    const path = join(outDir, `${id}.png`);
    const buf = await el.screenshot({ omitBackground: true });
    writeFileSync(path, setDpi(buf, 300));
    (shots[id] ??= {})[variant] = path;
  }
  await page.close();
  console.log("ok", variant);
}

// Aperçus : chaque design posé sur un pull clair et un pull foncé.
const sweater = (fill, stroke) => `<svg viewBox="0 0 600 640" width="600" height="640">
  <path d="M190 40 Q300 95 410 40 L520 85 Q560 100 572 140 L598 420 Q600 440 580 444 L520 452 Q505 452 503 436 L488 250 L486 600 Q486 622 464 622 L136 622 Q114 622 114 600 L112 250 L97 436 Q95 452 80 452 L20 444 Q0 440 2 420 L28 140 Q40 100 80 85 Z"
    fill="${fill}" stroke="${stroke}" stroke-width="3"/>
  <path d="M190 40 Q300 110 410 40" fill="none" stroke="${stroke}" stroke-width="10" opacity=".35"/>
  <path d="M116 585 H484 M512 420 L590 412 M88 420 L10 412" stroke="${stroke}" stroke-width="6" opacity=".25"/>
</svg>`;
const uri = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
const cards = Object.entries(shots).map(([id, v]) => `
  <figure><div class="pair">
    <div class="s">${sweater("#ece6da", "#cfc6b5")}<img src="${uri(v["pour-pull-clair"])}"></div>
    <div class="s">${sweater("#26302c", "#121815")}<img src="${uri(v["pour-pull-fonce"])}"></div>
  </div><figcaption>${id}</figcaption></figure>`).join("");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body { margin: 0; background: #f4f4f2; font-family: sans-serif; padding: 30px; width: 1300px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
figure { margin: 0; background: #fff; border-radius: 14px; padding: 20px; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.s { position: relative; } .s svg { width: 100%; height: auto; }
.s img { position: absolute; left: 50%; top: 26%; width: 40%; transform: translateX(-50%); }
figcaption { text-align: center; color: #555; font-size: 18px; margin-top: 8px; }
</style></head><body><div class="grid">${cards}</div></body></html>`;
const file = join(build, "apercu.html");
writeFileSync(file, html);
const page = await browser.newPage({ viewport: { width: 1360, height: 800 } });
await page.goto(pathToFileURL(file).href);
await page.screenshot({ path: join(previewsDir, "tous-les-designs.jpg"), type: "jpeg", quality: 85, fullPage: true });
await browser.close();
console.log("aperçu ok");
