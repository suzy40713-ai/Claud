import type { ProductAnalysis } from "../analysis";
import {
  audienceIdeas,
  audienceOf,
  benefitList,
  channelIdeas,
  clean,
  firstSentence,
  lowerFirst,
  noun,
  priceText,
  type ProductInfo,
} from "./common";

/** Analyse de produit construite à partir de la fiche (aucune donnée de marché). */
export function analysisTemplate(p: ProductInfo): ProductAnalysis {
  const benefits = benefitList(p);
  const audience = audienceOf(p);
  const price = priceText(p);
  const desc = firstSentence(p.description);
  const main = benefits[0] ?? null;

  const strengths: ProductAnalysis["strengths"] = benefits
    .slice(0, 3)
    .map((b) => ({ text: `Avantage mis en avant : ${lowerFirst(b)}.`, basis: "fourni" as const }));
  if (price) strengths.push({ text: `Le prix est affiché (${price}) : l'acheteur sait à quoi s'attendre.`, basis: "fourni" });
  if (p.url) strengths.push({ text: "Une page existe déjà pour acheter : chaque contenu peut y renvoyer.", basis: "fourni" });
  if (audience) strengths.push({ text: `Le public visé est défini : ${lowerFirst(audience)}.`, basis: "fourni" });
  if (!strengths.length)
    strengths.push({ text: `La description donne une base : « ${desc} ».`, basis: "fourni" });

  const weaknesses: ProductAnalysis["weaknesses"] = [];
  if (!benefits.length)
    weaknesses.push({ text: "Aucun avantage n'est listé : écrivez 3 bénéfices concrets pour l'acheteur.", basis: "fourni" });
  if (!audience)
    weaknesses.push({ text: "Le public visé n'est pas précisé : décrivez votre client idéal en une phrase.", basis: "fourni" });
  if (!price) weaknesses.push({ text: "Aucun prix indiqué : un prix visible rassure et facilite la décision.", basis: "fourni" });
  if (!p.url) weaknesses.push({ text: "Aucune page de vente renseignée : où les gens peuvent-ils acheter ?", basis: "fourni" });
  if (clean(p.description).length < 120)
    weaknesses.push({ text: "La description est courte : précisez ce que l'acheteur reçoit exactement.", basis: "fourni" });
  weaknesses.push({
    text: "Aucune preuve n'est mentionnée (avis, photos de clients, démonstration). À ajouter dès les premières ventes.",
    basis: "hypothese",
  });

  const audiences: ProductAnalysis["audiences"] = [];
  if (audience)
    audiences.push({
      name: audience.length > 60 ? `${audience.slice(0, 57)}…` : audience,
      description: "Le public que vous avez indiqué.",
      motivation: main ? `Profiter de cet avantage : ${lowerFirst(main)}.` : "Répondre au besoin décrit dans votre fiche.",
      basis: "fourni",
    });
  for (const a of audienceIdeas(p).slice(0, audience ? 2 : 3)) audiences.push({ ...a, basis: "hypothese" });

  const positioning = `${p.name} : ${audience ? `le ${noun(p)} pour ${lowerFirst(audience)}` : `un ${noun(p)} simple à comprendre`}.${main ? ` Son point fort : ${lowerFirst(main)}.` : ""}`;

  const pricing = price
    ? `Prix indiqué : ${price}. Vérifiez qu'il est cohérent avec ce que l'acheteur reçoit et avec le temps ou le coût de fabrication. Testez-le auprès de 5 personnes de votre public : si personne ne trouve ça cher, il est peut-être trop bas.`
    : "Pour fixer un prix : additionnez votre coût (matière, temps, frais de la plateforme), ajoutez votre marge, puis comparez vous-même avec 3 offres similaires que vous trouvez en ligne. Commencez par un prix simple et ajustez après les premières ventes.";

  const angles: ProductAnalysis["angles"] = [
    {
      title: "Le problème résolu",
      hook: main ? `${main} : voilà ce qui change avec ${p.name}.` : `Le problème que ${p.name} règle, en 15 secondes.`,
    },
    { title: "Les coulisses", hook: `Voilà comment ${p.name} est ${p.category === "service" || p.category === "formation" ? "préparé" : "fabriqué"}, du début à la fin.` },
    { title: "Le résultat", hook: `Ce que vous obtenez avec ${p.name}, concrètement.` },
  ];

  const objections: ProductAnalysis["objections"] = [
    {
      objection: "C'est trop cher.",
      answer: price
        ? `Détaillez ce qui est inclus pour ${price} et ce que ça évite (temps, erreurs, achats inutiles).`
        : "Affichez le prix et ce qu'il comprend : l'absence de prix fait souvent fuir.",
    },
    { objection: "Je ne vous connais pas, est-ce sérieux ?", answer: "Montrez-vous au travail, publiez les premiers avis et indiquez comment vous contacter." },
    {
      objection: "Je peux trouver la même chose ailleurs.",
      answer: main ? `Mettez en avant ce qui vous distingue : ${lowerFirst(main)}.` : "Expliquez ce qui rend votre offre différente : votre méthode, votre histoire, votre suivi.",
    },
  ];

  const filled = [benefits.length > 0, Boolean(audience), Boolean(price), Boolean(p.url)].filter(Boolean).length;
  return {
    pitch: `${p.name}, ${audience ? `le ${noun(p)} pensé pour ${lowerFirst(audience)}` : `un ${noun(p)}`}. ${desc}.${benefits.length ? ` ${benefits.slice(0, 2).map((b) => b.charAt(0).toUpperCase() + b.slice(1)).join(", ")}.` : ""}${price ? ` Disponible pour ${price}.` : ""}`,
    potential: {
      level: filled >= 3 ? "moyen" : "faible",
      reasoning:
        filled >= 3
          ? "Votre fiche est complète (avantages, public, prix) : c'est une bonne base pour vendre. Le vrai potentiel se mesurera avec vos premiers retours clients."
          : "Il manque encore des éléments clés dans votre fiche (avantages, public visé, prix ou page de vente). Complétez-les avant d'estimer le potentiel.",
    },
    sellingArguments: [
      ...benefits.slice(0, 3).map((b) => `${b.charAt(0).toUpperCase()}${b.slice(1)}`),
      price ? `Un prix clair : ${price}` : "Un prix simple et affiché",
      "Une personne réelle derrière le produit, joignable facilement",
    ].slice(0, 4),
    improvements: [
      ...(!benefits.length ? ["Lister 3 avantages concrets pour le client"] : []),
      ...(!audience ? ["Préciser le client idéal en une phrase"] : []),
      ...(!price ? ["Afficher un prix"] : []),
      ...(!p.url ? ["Créer une page de vente simple (même une page Instagram ou Etsy)"] : []),
      "Ajouter des preuves dès les premières ventes : avis, photos, démonstration",
      "Tester l'offre auprès de 5 personnes du public visé avant d'investir",
    ].slice(0, 5),
    summary: `${p.name} (${noun(p)}) : ${desc}.${audience ? ` Public visé : ${lowerFirst(audience)}.` : " Le public visé reste à préciser."}`,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 4),
    audiences,
    positioning,
    pricing,
    angles,
    channels: channelIdeas(p),
    objections,
    toVerify: [
      "Le problème que résout votre produit est-il vraiment important pour vos acheteurs ?",
      price ? `Votre public trouve-t-il ${price} justifié ?` : "Combien votre public serait-il prêt à payer ?",
      "Où votre public passe-t-il du temps en ligne ?",
      "Qu'est-ce qui pourrait l'empêcher d'acheter aujourd'hui ?",
    ],
    firstActions: [
      "Écrire 3 avantages concrets de votre produit et les ajouter à votre fiche.",
      "Poser les questions « à vérifier » à 5 personnes de votre public (message ou appel).",
      `Publier une première vidéo « ${angles[0].hook} » sur ${channelIdeas(p)[0].channel}.`,
    ],
  };
}
