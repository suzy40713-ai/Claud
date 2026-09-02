// Cotizo Pro — achat unique 19,99 EUR, sans backend : le lien Stripe est un
// "Payment Link" hebergene par Stripe (cree depuis le dashboard Stripe, pas
// par code), configure pour rediriger vers cette app avec ?pro=success.
//
// Limite assumee : sans serveur pour verifier le paiement cote Stripe, ce
// deverrouillage repose sur la presence du parametre d'URL au retour. Une
// personne technique pourrait deverrouiller manuellement en tapant l'URL.
// Pour un outil a 19,99EUR sans donnees sensibles derriere le mur payant,
// c'est un compromis pragmatique courant chez les petits outils sans
// backend — mais ce n'est PAS une verification de paiement cryptographique.
// A remplacer par une vraie verification serveur (webhook Stripe) si Cotizo
// prend de l'ampleur.
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/REMPLACE_MOI";

export function checkForProUnlockInUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("pro") === "success") {
    params.delete("pro");
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", cleanUrl);
    return true;
  }
  return false;
}
