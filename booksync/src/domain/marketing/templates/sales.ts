import type { SalesOutput } from "../tools/sales";
import { audienceOf, benefitList, clean, lowerFirst, noun, priceText, type ProductInfo } from "./common";

type Values = { problem: string; pageText: string };

/** Vérifications simples sur le texte collé (aucune visite du site). */
export function pageChecks(text: string) {
  const t = text.toLowerCase();
  return {
    provided: clean(text).length > 0,
    length: clean(text).length,
    price: /\d\s?(€|eur)/.test(t),
    delivery: /livr|expédi|délai|envoi|reçu|accès immédiat|téléchargement/.test(t),
    guarantee: /garanti|rembours|retour|satisfait/.test(t),
    reviews: /avis|témoign|client(e)?s? satisf|étoiles|★/.test(t),
    contact: /contact|question|whatsapp|@|message/.test(t),
    cta: /acheter|commander|ajouter au panier|réserver|je (le|la) veux|s'inscrire|s'abonner/.test(t),
  };
}

export function salesTemplate(p: ProductInfo, v: Values): SalesOutput {
  const c = pageChecks(v.pageText ?? "");
  const b = benefitList(p).map(lowerFirst);
  const price = priceText(p);
  const audience = audienceOf(p);
  const wins: SalesOutput["quickWins"] = [];
  const add = (action: string, why: string, effort: "faible" | "moyen" | "important") =>
    wins.length < 5 && wins.push({ action, why, effort });

  if (c.provided) {
    if (!c.price) add("Afficher le prix clairement en haut de la page", "Votre texte ne contient pas de prix : beaucoup de visiteurs partent sans chercher.", "faible");
    if (!c.cta) add("Ajouter un bouton d'achat explicite (« Commander », « Réserver »)", "Aucun appel à l'action clair n'apparaît dans votre texte.", "faible");
    if (!c.delivery) add("Préciser les délais de livraison ou d'accès", "Votre texte ne dit pas quand l'acheteur reçoit son produit.", "faible");
    if (!c.guarantee) add("Indiquer vos conditions de retour ou de remboursement", "Aucune garantie n'est mentionnée ; rappelez au minimum le droit de rétractation s'il s'applique.", "faible");
    if (!c.reviews) add("Ajouter vos premiers avis réels dès que vous en avez", "Votre texte ne contient aucun avis ni témoignage.", "moyen");
    if (!c.contact) add("Indiquer comment vous poser une question", "Un visiteur qui hésite doit pouvoir vous écrire facilement.", "faible");
    if (c.length < 300) add("Développer la description : ce que c'est, pour qui, ce qu'on reçoit", "Votre texte est court (moins de 300 caractères).", "moyen");
  }
  const byProblem: Record<string, Array<[string, string, "faible" | "moyen" | "important"]>> = {
    "pas-de-visites": [
      ["Publier une vidéo par jour qui renvoie vers la page", "Sans visites, la page ne peut pas vendre : le problème est d'abord la visibilité.", "moyen"],
      ["Mettre le lien dans votre bio et dans chaque description", "Chaque contenu doit mener à la page.", "faible"],
    ],
    "pas-de-ventes": [
      ["Mettre le bénéfice principal dans le titre", "Le visiteur doit comprendre en 3 secondes ce qu'il y gagne.", "faible"],
      ["Ajouter une photo ou une vidéo du produit en situation", "Voir le produit utilisé rassure plus qu'une photo seule.", "moyen"],
    ],
    paniers: [
      ["Afficher les frais de livraison avant le panier", "Des frais découverts au dernier moment font souvent abandonner (hypothèse à vérifier dans vos statistiques de boutique).", "faible"],
      ["Réduire le nombre d'étapes de commande", "Chaque champ en moins facilite l'achat.", "moyen"],
    ],
    "panier-moyen": [
      ["Proposer un lot (2 ou 3 produits) à prix légèrement réduit", "Un lot augmente le montant d'achat sans chercher de nouveaux clients.", "moyen"],
      ["Proposer un complément au moment de l'achat", "Un petit produit en plus, utile avec le principal.", "moyen"],
    ],
    inconnu: [
      ["Demander à 3 personnes de votre public de regarder votre page et de dire ce qui les freine", "Le plus rapide pour trouver le vrai frein.", "faible"],
      ["Noter chaque semaine visites, clics et ventes", "Sans chiffres, impossible de savoir où ça bloque.", "faible"],
    ],
  };
  for (const [a, w, e] of byProblem[v.problem] ?? byProblem.inconnu) add(a, w, e);
  if (wins.length < 3) add("Mettre le bénéfice principal dans le titre", "Le visiteur doit comprendre en 3 secondes ce qu'il y gagne.", "faible");

  const diagnosis = c.provided
    ? `D'après le texte que vous avez collé (pas d'après le site lui-même) : ${[
        !c.price && "le prix n'apparaît pas",
        !c.cta && "aucun bouton d'achat n'est clairement nommé",
        !c.reviews && "aucun avis n'est cité",
        !c.delivery && "les délais ne sont pas précisés",
      ]
        .filter(Boolean)
        .join(", ") || "les éléments essentiels sont présents ; le frein est peut-être ailleurs (visibilité, prix, confiance)"}. C'est une hypothèse à vérifier avec vos chiffres.`
    : `Sans texte de page, ces pistes partent de votre fiche produit et de la situation choisie. Collez le texte de votre page pour des conseils plus précis.`;

  return {
    diagnosis,
    quickWins: wins,
    rewrites: [
      { element: "Titre", proposal: b[0] ? `${p.name} : ${b[0]}` : `${p.name}, ${noun(p)}${audience ? ` pour ${lowerFirst(audience)}` : ""}` },
      { element: "Première phrase", proposal: `${audience ? `Pour ${lowerFirst(audience)}` : "Pour vous"} : ${p.name}${b[0] ? `, ${b[0]}` : ""}${price ? `, ${price}` : ""}.` },
      { element: "Bouton", proposal: p.category === "service" || p.category === "formation" ? "Je réserve ma place" : "Je commande" },
    ],
    abTests: [
      { element: "Titre", versionA: p.name, versionB: b[0] ? `${p.name} : ${b[0]}` : `${p.name}, simplement`, measure: "Le taux de clic sur le bouton d'achat." },
      { element: "Bouton", versionA: "Acheter", versionB: p.category === "service" ? "Je réserve" : "Je le veux", measure: "Le nombre de clics sur le bouton." },
      { element: "Image principale", versionA: "Photo du produit seul", versionB: "Photo ou vidéo du produit utilisé", measure: "Les ventes sur une même période." },
    ],
    trust: [
      "Vos premiers avis clients, avec leur accord.",
      "Une photo de vous ou de votre atelier.",
      "Vos conditions de retour ou de remboursement.",
      "Un moyen de contact visible.",
    ],
    upsell: [
      "Un lot de plusieurs produits à prix légèrement réduit.",
      "Une version « premium » avec un petit plus réel.",
      "Une offre de lancement réelle et limitée dans le temps, annoncée honnêtement.",
    ],
  };
}
