/**
 * Académie BookSync : apprendre le business quand on débute, leçon par leçon.
 * Contenu fixe, pratique, sans promesse de revenus. Chaque leçon se termine par une action à
 * faire dans BookSync.
 */
import type { PlanId } from "@/domain/billing/plans";

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  /** Forfait minimum pour lire la leçon. */
  minPlan: PlanId;
  paragraphs: string[];
  keyPoints: string[];
  action: { label: string; href: string };
};

export type AcademyModule = { id: string; title: string; lessons: Lesson[] };

export const ACADEMY: AcademyModule[] = [
  {
    id: "demarrer",
    title: "1. Démarrer",
    lessons: [
      {
        id: "verite-argent",
        title: "Gagner de l'argent : ce qui marche vraiment",
        minutes: 4,
        minPlan: "free",
        paragraphs: [
          "Gagner de l'argent avec un business, c'est toujours la même chose : résoudre un problème ou faire plaisir à quelqu'un, qui accepte de payer pour ça. Il n'y a pas de bouton magique, mais il y a une méthode, et elle s'apprend.",
          "Méfiez-vous des promesses du type « 5 000 € par mois sans rien faire ». Les gens qui réussissent commencent petit : une idée simple, quelques clients, puis ils améliorent ce qui marche.",
          "Votre objectif des 30 prochains jours n'est pas de devenir riche. C'est de faire votre première vente. Une seule. Elle prouve que des gens veulent ce que vous proposez, et tout devient plus facile après.",
        ],
        keyPoints: [
          "Un business = un problème résolu pour quelqu'un qui paie",
          "Commencez petit et améliorez ce qui marche",
          "Premier objectif : une seule vente",
        ],
        action: { label: "Trouver mon idée", href: "/tableau-de-bord/trouver-une-idee" },
      },
      {
        id: "trouver-idee",
        title: "Trouver votre idée à partir de ce que vous savez faire",
        minutes: 5,
        minPlan: "free",
        paragraphs: [
          "La meilleure idée pour débuter n'est pas la plus originale : c'est celle que vous pouvez lancer cette semaine, avec ce que vous savez déjà faire et ce que vous avez déjà (un téléphone, un ordinateur, du temps).",
          "Posez-vous trois questions : qu'est-ce qu'on me demande souvent de l'aide pour faire ? Qu'est-ce que je fais facilement alors que d'autres trouvent ça pénible ? Qui autour de moi a un problème que je pourrais régler ?",
          "Une bonne idée de départ coûte presque rien à lancer, peut être vendue à des gens que vous pouvez contacter facilement, et se teste en quelques jours. Si personne n'en veut, vous changez d'idée sans avoir perdu d'argent.",
        ],
        keyPoints: [
          "Partez de ce que vous savez déjà faire",
          "Choisissez une idée qui ne coûte presque rien à lancer",
          "Testez vite : si ça ne prend pas, changez",
        ],
        action: { label: "Choisir une idée", href: "/tableau-de-bord/trouver-une-idee" },
      },
      {
        id: "statut",
        title: "Le statut de micro-entrepreneur, simplement",
        minutes: 5,
        minPlan: "free",
        paragraphs: [
          "Pour vendre légalement en France, le plus simple est la micro-entreprise. La déclaration est gratuite et se fait en ligne sur le guichet unique (formalites.entreprises.gouv.fr). Vous recevez votre numéro SIRET en quelques jours.",
          "Vous payez des cotisations seulement sur ce que vous encaissez : un pourcentage de votre chiffre d'affaires, qui dépend de votre activité (vente de marchandises, services…). Pas de chiffre d'affaires, pas de cotisations. Vérifiez le taux exact sur autoentrepreneur.urssaf.fr.",
          "Gardez une trace de chaque vente (date, client, montant) dès le premier euro. BookSync vous permet de les noter dans « Mes résultats ». Certains métiers sont réglementés : renseignez-vous avant de démarrer.",
        ],
        keyPoints: [
          "Déclaration gratuite sur le guichet unique",
          "Cotisations seulement sur ce que vous encaissez",
          "Notez chaque vente dès le premier euro",
        ],
        action: { label: "Ajouter mon produit", href: "/tableau-de-bord/produits/nouveau" },
      },
    ],
  },
  {
    id: "vendre",
    title: "2. Vendre",
    lessons: [
      {
        id: "prix",
        title: "Fixer votre prix sans vous sous-estimer",
        minutes: 5,
        minPlan: "starter",
        paragraphs: [
          "L'erreur la plus fréquente des débutants : vendre trop peu cher. Un prix trop bas attire les clients difficiles et ne vous permet pas de continuer.",
          "Calculez d'abord votre coût : matière, frais de la plateforme, cotisations, et surtout votre temps. Ajoutez votre marge. Puis regardez vous-même 3 offres comparables en ligne pour vérifier que vous restez cohérent.",
          "Commencez avec un prix de lancement pour vos 3 à 5 premiers clients, en échange d'un avis. Ensuite, passez à votre vrai prix. Annoncez-le clairement : un prix affiché rassure.",
        ],
        keyPoints: [
          "Coût + temps + marge = votre prix",
          "Prix de lancement pour les premiers, en échange d'un avis",
          "Affichez toujours votre prix",
        ],
        action: { label: "Analyser mon produit", href: "/tableau-de-bord/produits" },
      },
      {
        id: "premiers-clients",
        title: "Trouver vos 10 premiers clients",
        minutes: 6,
        minPlan: "starter",
        paragraphs: [
          "Vos 10 premiers clients ne viendront pas d'une vidéo virale. Ils viennent presque toujours de votre entourage, de leurs recommandations et de conversations directes.",
          "Faites une liste de 30 personnes que vous connaissez (famille, amis, anciens collègues, voisins) et envoyez à chacune un message personnel : ce que vous lancez, pour qui, et une question simple (« tu connais quelqu'un que ça pourrait aider ? »).",
          "En parallèle, allez là où sont vos clients : groupes Facebook de votre ville ou de votre thème, forums, commerces du quartier. Aidez d'abord, proposez ensuite.",
        ],
        keyPoints: [
          "Les premiers clients viennent du bouche-à-oreille",
          "30 messages personnels, pas de copier-coller",
          "Aidez d'abord, proposez ensuite",
        ],
        action: { label: "Créer ma stratégie 30 jours", href: "/tableau-de-bord/strategies" },
      },
      {
        id: "offre",
        title: "Écrire une offre qui donne envie",
        minutes: 5,
        minPlan: "starter",
        paragraphs: [
          "Une bonne offre répond en une phrase à : c'est quoi, c'est pour qui, et qu'est-ce que ça change pour eux. Exemple : « Je monte tes vidéos TikTok en 48 h pour que tu publies sans y passer tes soirées. »",
          "Parlez du résultat, pas de vous. « Je suis passionné » intéresse moins que « vous gagnez 3 heures par semaine ».",
          "Ajoutez ce qui rassure : ce qui est inclus, le délai, le prix, comment vous contacter. Ne promettez jamais un résultat que vous ne pouvez pas garantir.",
        ],
        keyPoints: [
          "C'est quoi, pour qui, qu'est-ce que ça change",
          "Parlez du résultat pour le client",
          "Rassurez sans promettre l'impossible",
        ],
        action: { label: "Améliorer ma page de vente", href: "/tableau-de-bord/sales-booster" },
      },
      {
        id: "vendre-message",
        title: "Vendre par message sans être lourd",
        minutes: 4,
        minPlan: "starter",
        paragraphs: [
          "Vendre, ce n'est pas forcer. C'est aider quelqu'un à décider. Commencez par une question sur son besoin, écoutez, puis proposez votre solution si elle correspond.",
          "Répondez vite, simplement, et terminez toujours par une étape claire : « Je te réserve une place ? » ou « Je t'envoie le lien de paiement ? ».",
          "Si la personne dit non ou ne répond pas, relancez une seule fois, gentiment, quelques jours plus tard. Puis passez à la suivante.",
        ],
        keyPoints: [
          "Questionnez d'abord, proposez ensuite",
          "Toujours une prochaine étape claire",
          "Une seule relance, puis on avance",
        ],
        action: { label: "Préparer mes contenus", href: "/tableau-de-bord/contenus" },
      },
    ],
  },
  {
    id: "visibilite",
    title: "3. Se faire connaître",
    lessons: [
      {
        id: "reseaux-sans-visage",
        title: "Les réseaux sociaux sans montrer votre visage",
        minutes: 5,
        minPlan: "starter",
        paragraphs: [
          "Vous n'avez pas besoin de vous filmer pour vendre. Vos mains, votre écran, votre produit, votre voix ou du texte à l'écran suffisent.",
          "Choisissez un seul réseau pour commencer (souvent TikTok) et publiez régulièrement : une vidéo par jour pendant 30 jours vous apprendra plus que n'importe quelle formation.",
          "Chaque vidéo doit apporter quelque chose : un conseil, une coulisse, un avant/après, une réponse à une question. Terminez en disant où trouver votre offre.",
        ],
        keyPoints: [
          "Mains, écran, produit ou voix off suffisent",
          "Un seul réseau, une vidéo par jour",
          "Chaque vidéo apporte quelque chose",
        ],
        action: { label: "Générer mes contenus", href: "/tableau-de-bord/contenus" },
      },
      {
        id: "accroche",
        title: "Une vidéo qui accroche en 3 secondes",
        minutes: 4,
        minPlan: "starter",
        paragraphs: [
          "Les gens décident en 2 ou 3 secondes s'ils regardent votre vidéo. La première phrase et le texte à l'écran font presque tout.",
          "Des accroches qui marchent souvent : une question (« Vous faites encore cette erreur ? »), une promesse précise et honnête (« 3 idées pour vendre sans stock »), ou un résultat montré tout de suite.",
          "Regardez vos statistiques : gardez les accroches qui retiennent le plus et réutilisez-les avec un nouveau sujet.",
        ],
        keyPoints: [
          "Tout se joue dans les 3 premières secondes",
          "Question, promesse honnête ou résultat montré",
          "Réutilisez les accroches qui marchent",
        ],
        action: { label: "Créer une publicité", href: "/tableau-de-bord/publicites" },
      },
      {
        id: "avis",
        title: "Récolter des avis et des preuves",
        minutes: 3,
        minPlan: "starter",
        paragraphs: [
          "Les gens achètent plus facilement quand d'autres ont déjà acheté. Après chaque vente, demandez un avis en une phrase et, si possible, une photo.",
          "Demandez l'accord de la personne avant de publier son avis. Ne créez jamais de faux avis : c'est interdit et ça détruit la confiance.",
          "Rassemblez vos avis à un seul endroit (une story à la une, une page) et citez-les dans vos contenus.",
        ],
        keyPoints: [
          "Un avis après chaque vente",
          "Toujours avec l'accord du client, jamais de faux avis",
          "Rassemble-les et montre-les",
        ],
        action: { label: "Voir mon Autopilot", href: "/tableau-de-bord/autopilot-marketing" },
      },
    ],
  },
  {
    id: "rentabiliser",
    title: "4. Rentabiliser",
    lessons: [
      {
        id: "marge",
        title: "Est-ce que vous gagnez vraiment de l'argent ?",
        minutes: 5,
        minPlan: "starter",
        paragraphs: [
          "Le chiffre d'affaires, c'est ce que vous encaissez. Ce que vous gagnez vraiment, c'est ce qui reste après les achats, les frais, la publicité, les abonnements et les cotisations.",
          "Faites le calcul une fois par mois : chiffre d'affaires moins toutes vos dépenses. Si c'est positif, vous êtes rentable. Si c'est négatif, regardez quelle dépense ne rapporte rien.",
          "Notez vos ventes et vos dépenses dans « Mes résultats » : BookSync calcule votre coût par vente et votre retour sur dépense quand vous avez les chiffres.",
        ],
        keyPoints: [
          "Ce qui compte, c'est ce qui reste",
          "Faites le calcul chaque mois",
          "Coupez ce qui ne rapporte rien",
        ],
        action: { label: "Saisir mes résultats", href: "/tableau-de-bord/resultats" },
      },
      {
        id: "rentabiliser-abonnement",
        title: "Rentabiliser votre abonnement dès ce mois-ci",
        minutes: 3,
        minPlan: "starter",
        paragraphs: [
          "Votre abonnement est votre première dépense de business. Votre premier objectif chiffré est simple : faire au moins autant de ventes que ce qu'il vous coûte.",
          "Pour Starter à 9,99 €, une seule vente d'un service à 15 € suffit. Sur votre accueil, la jauge « Rentabiliser mon abonnement » se remplit à chaque vente que vous notez.",
          "Rien n'est garanti : ça dépend de ce que vous mettez en place. Mais si vous suivez votre Autopilot chaque jour, vous vous donnez les meilleures chances.",
        ],
        keyPoints: [
          "Objectif 1 : ventes ≥ prix de l'abonnement",
          "Notez chaque vente pour remplir votre jauge",
          "Suivez votre Autopilot chaque jour",
        ],
        action: { label: "Voir ma jauge", href: "/tableau-de-bord" },
      },
    ],
  },
  {
    id: "accelerer",
    title: "5. Accélérer",
    lessons: [
      {
        id: "premiere-pub",
        title: "Lancer votre première publicité sans vous ruiner",
        minutes: 6,
        minPlan: "pro",
        paragraphs: [
          "Ne paie jamais de publicité sur un contenu qui n'a pas déjà un peu marché gratuitement. La pub amplifie ce qui marche, elle ne répare pas ce qui ne marche pas.",
          "Fixez une limite avant de commencer, par exemple 50 € sur 10 jours, et ne la dépassez pas. Testez 2 ou 3 variantes en même temps et gardez la meilleure.",
          "Calculez votre coût par client : dépense divisée par le nombre de ventes. Si un client vous coûte plus que ce qu'il vous rapporte, arrêtez et améliorez votre offre d'abord.",
        ],
        keyPoints: [
          "La pub amplifie ce qui marche déjà",
          "Une limite fixée à l'avance",
          "Coût par client < ce qu'il rapporte",
        ],
        action: { label: "Créer mes publicités", href: "/tableau-de-bord/publicites" },
      },
      {
        id: "augmenter-prix",
        title: "Augmenter vos prix",
        minutes: 4,
        minPlan: "pro",
        paragraphs: [
          "Quand vous avez plus de demandes que de temps, c'est le signal pour augmenter vos prix. Vous gagnez autant en travaillant moins, ou plus en travaillant autant.",
          "Augmentez par paliers (10 à 20 %), annoncez-le à l'avance à vos clients actuels, et gardez l'ancien prix quelques semaines pour eux si vous voulez les remercier.",
          "Ajoutez de la valeur visible en même temps : un bonus, un délai plus court, un suivi.",
        ],
        keyPoints: [
          "Trop de demandes = augmentez vos prix",
          "Par paliers, annoncé à l'avance",
          "Ajoutez de la valeur visible",
        ],
        action: { label: "Modifier mon produit", href: "/tableau-de-bord/produits" },
      },
      {
        id: "fideliser",
        title: "Fidéliser : vendre à nouveau aux mêmes clients",
        minutes: 4,
        minPlan: "pro",
        paragraphs: [
          "Il est bien plus facile de revendre à un client content que d'en trouver un nouveau. Gardez le contact : un message pour prendre des nouvelles, une offre réservée aux anciens clients.",
          "Proposez une suite logique : un deuxième service, un pack, un abonnement mensuel. Demandez à vos clients ce qu'ils aimeraient que vous proposiez.",
          "Un client satisfait est aussi votre meilleur commercial : proposez-lui une réduction s'il vous recommande à un ami.",
        ],
        keyPoints: [
          "Revendre coûte moins cher que trouver",
          "Proposez une suite logique",
          "Récompensez les recommandations",
        ],
        action: { label: "Booster mes ventes", href: "/tableau-de-bord/sales-booster" },
      },
    ],
  },
];

export const ALL_LESSONS = ACADEMY.flatMap((m) => m.lessons);

export function findLesson(id: string) {
  return ALL_LESSONS.find((l) => l.id === id) ?? null;
}

/** Leçon suivante dans l'ordre de l'Académie. */
export function nextLesson(id: string) {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? (ALL_LESSONS[i + 1] ?? null) : null;
}
