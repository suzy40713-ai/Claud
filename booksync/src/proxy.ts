import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Vérification optimiste : sans cookie de session, les pages privées redirigent vers la connexion.
 * La vérification réelle (session valide en base) est faite côté serveur dans chaque page.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(getSessionCookie(request, { cookiePrefix: "booksync" }));
  if (!hasSession) {
    const url = new URL("/connexion", request.url);
    const target = request.nextUrl.pathname + request.nextUrl.search;
    if (target !== "/tableau-de-bord") url.searchParams.set("redirection", target);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/tableau-de-bord/:path*", "/onboarding/:path*"],
};
