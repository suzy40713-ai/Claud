/**
 * Rendez-vous en visio : validation du lien fixe du professionnel (Google Meet, Zoom, Teams…).
 * Logique pure, testée unitairement.
 */
import type { PlanFeatures } from "@/domain/billing/plans";

export const MEETING_URL_MAX = 300;

export function normalizeMeetingUrl(
  input: string,
): { ok: true; url: string | null } | { ok: false; error: string } {
  const raw = input.trim();
  if (!raw) return { ok: true, url: null };
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (withScheme.length > MEETING_URL_MAX) return { ok: false, error: "Lien trop long." };
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return {
      ok: false,
      error: "Ce lien n'est pas valide. Exemple : https://meet.google.com/abc-defg-hij",
    };
  }
  if (url.protocol !== "https:")
    return { ok: false, error: "Le lien doit commencer par https:// (lien sécurisé)." };
  if (!url.hostname.includes(".") || url.username || url.password)
    return {
      ok: false,
      error: "Ce lien n'est pas valide. Exemple : https://meet.google.com/abc-defg-hij",
    };
  return { ok: true, url: url.toString() };
}

/** Lien de visio à montrer aux clients : seulement si le forfait l'inclut. */
export function meetingLinkFor(
  org: { meetingUrl: string | null },
  features: Pick<PlanFeatures, "onlineMeetings">,
) {
  return features.onlineMeetings && org.meetingUrl ? org.meetingUrl : null;
}
