import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Jeton aléatoire de 256 bits, encodé en base64url (adapté aux URL). */
export function generateToken() {
  return randomBytes(32).toString("base64url");
}

/** Seule l'empreinte SHA-256 est stockée : une fuite de la base ne révèle aucun lien valide. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
