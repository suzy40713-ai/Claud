import type { BlogArticle } from "@/domain/blog/article";

const para = (n: number) =>
  `Commencez par lister ce que vous savez déjà faire et ce que vos proches vous demandent souvent. ` +
  `Notez ensuite pour chaque idée le temps qu'elle demande, le matériel nécessaire et la personne qui pourrait l'acheter. ` +
  `Cette étape ${n} vous aide à comparer vos options sans dépenser d'argent et à garder seulement celles que vous pouvez tester cette semaine.`;

/** Article valide (plus de 650 mots, aucune promesse interdite). */
export function sampleArticle(over: Partial<BlogArticle> = {}): BlogArticle {
  return {
    title: "Quoi vendre quand on débute : la méthode simple en 4 étapes",
    metaDescription:
      "Vous ne savez pas quoi vendre ? Voici une méthode simple pour choisir une première idée à partir de ce que vous savez déjà faire, et la tester sans dépenser.",
    intro:
      "Vous avez envie de vendre quelque chose, mais vous ne savez pas quoi. C'est la situation la plus fréquente au départ. Voici une méthode concrète pour choisir.",
    sections: [1, 2, 3, 4, 5].map((i) => ({
      heading: `Étape ${i} : avancer sans se disperser`,
      paragraphs: [para(i), para(i + 10)],
      bullets: ["Noter vos compétences", "Demander l'avis de trois personnes", "Choisir une seule idée"],
    })),
    faq: [
      { question: "Faut-il de l'argent pour commencer ?", answer: "Non, beaucoup d'idées demandent surtout du temps. Commencez petit et testez." },
      { question: "Combien de temps pour une première vente ?", answer: "Cela dépend de votre idée et de vos actions. Parler chaque jour à des clients aide." },
      { question: "Et si mon idée ne marche pas ?", answer: "Vous aurez appris ce que veulent vos clients. Ajustez l'offre ou testez l'idée suivante." },
    ],
    takeaway: "Aujourd'hui, notez trois choses que vous savez faire et demandez à une personne laquelle elle achèterait.",
    ...over,
  };
}
