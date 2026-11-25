import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { BOOKING_ENABLED } from "@/lib/features";

/** Pages du tableau de bord propres à la réservation (désactivées avec BOOKING_ENABLED). */
const BOOKING_PAGES =
  /^\/tableau-de-bord\/(calendrier|reservations|liste-attente|clients|avis|cartes-cadeaux|services|statistiques|analyses|autopilot|notifications|equipe|demarrage|assistant|parametres\/(horaires|reservation|paiements|notifications|modules))(\/|$)/;

/**
 * Vérification optimiste : sans cookie de session, les pages privées redirigent vers la connexion.
 * La vérification réelle (session valide en base) est faite côté serveur dans chaque page.
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!BOOKING_ENABLED && BOOKING_PAGES.test(path))
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
  const hasSession = Boolean(getSessionCookie(request, { cookiePrefix: "booksync" }));
  if (!hasSession) {
    const url = new URL("/connexion", request.url);
    const target = path + request.nextUrl.search;
    if (target !== "/tableau-de-bord") url.searchParams.set("redirection", target);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/tableau-de-bord/:path*", "/onboarding/:path*", "/mon-espace/:path*"],
};
