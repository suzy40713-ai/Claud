export interface PublicPageFetchResult {
  status: "ok" | "blocked" | "error";
  title: string | null;
  metaDescription: string | null;
  textSnippet: string | null;
  error?: string;
}

const PRIVATE_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::1"]);

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (PRIVATE_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;

  // IPv4 literal checks (loopback, link-local, RFC1918 private ranges).
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }

  return false;
}

/**
 * Best-effort, read-only fetch of a public product page's HTML for the
 * "product page analysis" feature (spec §17). Deliberately conservative:
 * only plain http(s) URLs, no auth bypass, no crawling beyond the single
 * page, and a hostname allowlist check against common private/loopback
 * ranges to avoid this becoming a server-side request forgery vector.
 * Never used to access data that requires authentication.
 */
export async function fetchPublicPage(rawUrl: string): Promise<PublicPageFetchResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { status: "error", title: null, metaDescription: null, textSnippet: null, error: "URL invalide." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { status: "blocked", title: null, metaDescription: null, textSnippet: null, error: "Protocole non autorisé." };
  }

  if (isPrivateOrLocalHost(url.hostname)) {
    return {
      status: "blocked",
      title: null,
      metaDescription: null,
      textSnippet: null,
      error: "Cette adresse n'est pas accessible publiquement.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "LaunchPilotBot/1.0 (+https://launchpilot.app; audit de page produit)",
        accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        status: "error",
        title: null,
        metaDescription: null,
        textSnippet: null,
        error: `La page a répondu avec le statut ${response.status}.`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        status: "error",
        title: null,
        metaDescription: null,
        textSnippet: null,
        error: "Le contenu de cette page n'est pas du HTML.",
      };
    }

    // Cap read size to avoid pulling huge pages into memory.
    const html = (await response.text()).slice(0, 500_000);

    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;
    const metaDescription =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]?.trim() ||
      null;

    const textSnippet = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);

    return { status: "ok", title, metaDescription, textSnippet };
  } catch (error) {
    return {
      status: "error",
      title: null,
      metaDescription: null,
      textSnippet: null,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la récupération de la page.",
    };
  }
}
