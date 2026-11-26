import { finalizePurchase, startSession } from "@/server/account";
import { env } from "@/server/env";

/** Retour de Stripe : crédite le compte (une seule fois), ouvre la session, envoie au studio. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  const app = env().APP_URL;
  try {
    const accountId = await finalizePurchase(id);
    if (!accountId) return Response.redirect(`${app}/connexion?paiement=attente`, 303);
    await startSession(accountId);
    return Response.redirect(`${app}/studio?bienvenue=1`, 303);
  } catch (error) {
    console.error("[vidaia] retour paiement", error);
    return Response.redirect(`${app}/connexion?paiement=attente`, 303);
  }
}
