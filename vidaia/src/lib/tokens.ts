/**
 * Jetons signés sans état (HMAC-SHA256) : session (cookie) et lien d'accès envoyé par email.
 * Format : <accountId>.<expiration en secondes>.<signature base64url>
 */
import { createHmac, timingSafeEqual } from "node:crypto";

type Purpose = "session" | "lien";

function sign(secret: string, purpose: Purpose, accountId: string, exp: number) {
  return createHmac("sha256", secret).update(`${purpose}:${accountId}:${exp}`).digest("base64url");
}

export function createToken(secret: string, purpose: Purpose, accountId: string, ttlSeconds: number, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  return `${accountId}.${exp}.${sign(secret, purpose, accountId, exp)}`;
}

/** Identifiant du compte si le jeton est valide et non expiré, sinon null. */
export function verifyToken(secret: string, purpose: Purpose, token: string | undefined | null, now = Date.now()) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [accountId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!/^[0-9a-f-]{36}$/.test(accountId) || !Number.isInteger(exp)) return null;
  if (exp * 1000 < now) return null;
  const expected = Buffer.from(sign(secret, purpose, accountId, exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return accountId;
}
