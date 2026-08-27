// GitHub Pages sert ce site via une seule regle de fallback (404.html =
// copie de index.html) : ca fonctionne pour un navigateur (React Router
// prend le relais cote client) mais un crawler ou l'outil d'inspection
// d'URL de Google recoit un vrai statut HTTP 404 sur /blog/:slug, donc ces
// pages ne peuvent pas etre indexees. Ce script genere, apres le build,
// un fichier statique par article (clone de dist/index.html avec le
// <title>/<meta description> de l'article) : GitHub Pages le sert alors
// en 200 avec les bonnes metadonnees, et React Router prend toujours le
// relais normalement une fois le JS charge.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BLOG_POSTS } from "../src/features/blog/posts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");

function withMeta(html: string, title: string, description: string): string {
  const withTitle = html.replace(/<title>.*?<\/title>/s, `<title>${title}</title>`);
  if (/<meta name="description"/.test(withTitle)) {
    return withTitle.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${description}" />`
    );
  }
  return withTitle.replace(
    "</head>",
    `    <meta name="description" content="${description}" />\n  </head>`
  );
}

async function main() {
  const template = await readFile(resolve(distDir, "index.html"), "utf-8");

  const listHtml = withMeta(
    template,
    "Blog Cadenzo — Conseils musculation, nutrition et perte de poids",
    "Guides gratuits sur la musculation, la nutrition et la perte de poids : programmes, recettes, conseils pratiques pour progresser."
  );
  await mkdir(resolve(distDir, "blog"), { recursive: true });
  // On ecrit a la fois blog.html et blog/index.html (idem pour chaque
  // article) car on ne sait pas avec certitude si GitHub Pages resout
  // /blog (sans slash final) vers l'un ou l'autre : les deux couvrent le cas.
  await writeFile(resolve(distDir, "blog.html"), listHtml);
  await writeFile(resolve(distDir, "blog/index.html"), listHtml);

  for (const post of BLOG_POSTS) {
    const postHtml = withMeta(template, `${post.title} — Cadenzo`, post.description);
    const postDir = resolve(distDir, "blog", post.slug);
    await mkdir(postDir, { recursive: true });
    await writeFile(resolve(distDir, "blog", `${post.slug}.html`), postHtml);
    await writeFile(resolve(postDir, "index.html"), postHtml);
  }

  console.log(`Prerendered ${BLOG_POSTS.length} blog articles + blog index.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
