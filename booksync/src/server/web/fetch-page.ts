import "server-only";
import { lookup } from "node:dns/promises";
import { extractPage, isPublicIp, type PageSummary } from "@/domain/marketing/page-extract";

const MAX_BYTES = 600_000;
const MAX_REDIRECTS = 3;

export type FetchDeps = {
  fetch?: typeof fetch;
  resolve?: (host: string) => Promise<string[]>;
};

async function defaultResolve(host: string) {
  return (await lookup(host, { all: true })).map((a) => a.address);
}

/**
 * Lit une page web publique, de façon sûre : http(s) uniquement, adresses du réseau interne
 * refusées (à chaque redirection), taille et durée limitées, contenu HTML uniquement.
 * Renvoie null si la page n'est pas lisible.
 */
export async function fetchPublicPage(rawUrl: string, deps: FetchDeps = {}): Promise<PageSummary | null> {
  const fetchImpl = deps.fetch ?? fetch;
  const resolve = deps.resolve ?? defaultResolve;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    if (url.port && !["80", "443"].includes(url.port)) return null;
    let addresses: string[];
    try {
      addresses = await resolve(url.hostname);
    } catch {
      return null;
    }
    if (!addresses.length || !addresses.every(isPublicIp)) return null;
    let res: Response;
    try {
      res = await fetchImpl(url.toString(), {
        redirect: "manual",
        headers: { "User-Agent": "BookSyncBot/1.0 (analyse de concurrence)", Accept: "text/html" },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      url = new URL(loc, url);
      continue;
    }
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
    return extractPage(html, url.toString());
  }
  return null;
}
