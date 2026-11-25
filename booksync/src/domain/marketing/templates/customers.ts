import type { CustomersOutput } from "../tools/customers";
import { audienceIdeas, audienceOf, benefitList, channelIdeas, lowerFirst, noun, type ProductInfo } from "./common";

type Values = { market: string; buyer: string };

const INTERESTS: Record<string, string[]> = {
  physique: ["Décoration", "Idées cadeaux", "Fait main", "Achats en ligne"],
  numerique: ["Apprentissage en ligne", "Productivité", "Outils numériques", "Développement personnel"],
  service: ["Gain de temps", "Services à domicile", "Entrepreneuriat", "Vie de quartier"],
  formation: ["Formation en ligne", "Reconversion", "Développement personnel", "Carrière"],
  abonnement: ["Box mensuelles", "Découverte de produits", "Bons plans"],
  autre: ["Entrepreneuriat", "Achats en ligne", "Bons plans"],
};

export function customersTemplate(p: ProductInfo, v: Values): CustomersOutput {
  const benefits = benefitList(p).map(lowerFirst);
  const audience = audienceOf(p);
  const channels = channelIdeas(p);
  const where =
    v.market === "local" ? "près de chez vous" : v.market === "francophone" ? "dans les pays francophones" : "partout en France";
  const pro = v.buyer === "pros";
  const ideas = audienceIdeas(p);
  const base = [
    ...(audience
      ? [{ name: audience.length > 50 ? `${audience.slice(0, 47)}…` : audience, description: "Le public que vous avez indiqué.", motivation: benefits[0] ?? "le résultat promis par votre produit", fourni: true }]
      : []),
    ...ideas.map((i) => ({ name: i.name, description: i.description, motivation: lowerFirst(i.motivation), fourni: false })),
  ].slice(0, 3);
  const interests = INTERESTS[p.category] ?? INTERESTS.autre;
  return {
    personas: base.map((b, i) => ({
      name: pro && !b.fourni ? `Professionnels : ${lowerFirst(b.name)}` : b.name,
      description: `${b.description} Situés ${where}.`,
      needs: [
        benefits[0] ? `Profiter de cet avantage : ${benefits[0]}` : `Trouver un ${noun(p)} fiable et simple`,
        "Savoir exactement ce qu'il achète avant de payer",
      ],
      problems: [
        "Manque de temps pour comparer les offres",
        "Peur de payer pour quelque chose qui ne lui convient pas",
      ],
      motivations: [b.motivation.replace(/\.$/, ""), "Être rassuré par des avis ou une démonstration"],
      interests: interests.slice(i % 2, (i % 2) + 3),
      arguments: [
        benefits[0] ? `Mettre en avant : ${benefits[0]}` : `Montrer ${p.name} en situation réelle`,
        benefits[1] ? `Insister sur : ${benefits[1]}` : "Afficher clairement le prix et ce qui est inclus",
      ],
      channels: channels.slice(0, 2).map((c) => ({ platform: c.channel, how: c.why })),
      basis: b.fourni ? ("fourni" as const) : ("hypothese" as const),
    })),
    toVerify: [
      "Ces personnes ont-elles vraiment le problème que vous résolvez ?",
      "Combien seraient-elles prêtes à payer ?",
      "Où cherchent-elles une solution aujourd'hui ?",
    ],
    firstSteps: [
      "Listez 10 personnes qui correspondent au premier profil et envoyez-leur un message personnel",
      `Rejoignez 2 groupes ou communautés où se trouve ce public (${channels[0]?.channel ?? "réseaux sociaux"})`,
      "Posez les questions « à vérifier » à 5 personnes avant d'investir",
    ],
  };
}
