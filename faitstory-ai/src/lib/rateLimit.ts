interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory token bucket: fine for a single-instance free-tier deployment,
// no Redis dependency needed. Resets on process restart, which is an
// acceptable tradeoff for this app's scale.
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
