import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/tokens";

/**
 * Lien « gérer mon rendez-vous » envoyé au client : `{id}.{signature}`.
 * La signature HMAC (clé serveur) rend le lien impossible à deviner ou à falsifier,
 * et peut être recalculée pour les rappels sans stocker de secret en base.
 */
function secret() {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("BETTER_AUTH_SECRET manquant");
  return s;
}

function sign(appointmentId: string) {
  return createHmac("sha256", secret()).update(`booksync:rdv:${appointmentId}`).digest("base64url").slice(0, 32);
}

export function createManageToken(appointmentId: string) {
  return `${appointmentId}.${sign(appointmentId)}`;
}

export function verifyManageToken(token: string): string | null {
  const m = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32})$/.exec(token);
  if (!m) return null;
  return safeEqual(m[2], sign(m[1])) ? m[1] : null;
}

export function manageUrl(baseUrl: string, appointmentId: string) {
  return `${baseUrl}/rdv/${createManageToken(appointmentId)}`;
}
