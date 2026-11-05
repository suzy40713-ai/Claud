import "server-only";

/**
 * Limiteur en mémoire (fenêtre glissante) pour les actions publiques.
 * Suffisant pour une instance unique (Render) ; à remplacer par un stockage partagé si plusieurs instances.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number) {
  // Désactivable uniquement pour les tests de bout en bout (même variable que l'authentification).
  if (process.env.AUTH_RATE_LIMIT === "off") return true;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "inconnu"
  );
}
