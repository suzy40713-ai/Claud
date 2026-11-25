/**
 * Lecture d'une page web publique (logique pure) : titre, description, titres de sections,
 * prix affichés et texte visible. Aucun contenu n'est inventé : seulement ce qui est dans la page.
 */
export type PageSummary = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  prices: string[];
  text: string;
};

function decode(s: string) {
  return s
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&euro;/g, "€")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

const clean = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export function extractPage(html: string, url: string): PageSummary {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const title = clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(body)?.[1] ?? "").slice(0, 200);
  const description = clean(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(body)?.[1] ??
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i.exec(body)?.[1] ??
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i.exec(body)?.[1] ??
      "",
  ).slice(0, 400);
  const headings = [...body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((m) => clean(m[1]))
    .filter((h) => h.length > 2 && h.length < 160);
  const text = clean(body.replace(/<(header|nav|footer)[\s\S]*?<\/\1>/gi, " ")).slice(0, 4000);
  const prices = [
    ...new Set(
      [...text.matchAll(/(\d{1,5}(?:[.,]\d{2})?)\s?(?:€|EUR\b|euros?\b)/gi)].map((m) => `${m[1]} €`),
    ),
  ].slice(0, 12);
  return { url, title, description, headings: [...new Set(headings)].slice(0, 15), prices, text };
}

/** Adresse IP publique ? (refuse le réseau local, la boucle locale, les plages réservées) */
export function isPublicIp(ip: string): boolean {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80"))
      return false;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    return mapped ? isPublicIp(mapped[1]) : true;
  }
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  return true;
}
