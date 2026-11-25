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
          "Méfie-toi des promesses du type « 5 000 € par mois sans rien faire ». Les gens qui réussissent commencent petit : une idée simple, quelques clients, puis ils améliorent ce qui marche.",
          "Ton objectif des 30 prochains jours n'est pas de devenir riche. C'est de faire ta première vente. Une seule. Elle prouve que des gens veulent ce que tu proposes, et tout devient plus facile après.",
        ],
        keyPoints: [
          "Un business = un problème résolu pour quelqu'un qui paie",
          "Commence petit et améliore ce qui marche",
          "Premier objectif : une seule vente",
        ],
        action: { label: "Trouver mon idée", href: "/tableau-de-bord/trouver-une-idee" },
      },
      {
        id: "trouver-idee",
        title: "Trouver ton idée à partir de ce que tu sais faire",
        minutes: 5,
        minPlan: "free",
        paragraphs: [
          "La meilleure idée pour débuter n'est pas la plus originale : c'est celle que tu peux lancer cette semaine, avec ce que tu sais déjà faire et ce que tu as déjà (un téléphone, un ordinateur, du temps).",
          "Pose-toi trois questions : qu'est-ce qu'on me demande souvent de l'aide pour faire ? Qu'est-ce que je fais facilement alors que d'autres trouvent ça pénible ? Qui autour de moi a un problème que je pourrais régler ?",
          "Une bonne idée de départ coûte presque rien à lancer, peut être vendue à des gens que tu peux contacter facilement, et se teste en quelques jours. Si personne n'en veut, tu changes d'idée sans avoir perdu d'argent.",
        ],
        keyPoints: [
          "Pars de ce que tu sais déjà faire",
          "Choisis une idée qui ne coûte presque rien à lancer",
          "Teste vite : si ça ne prend pas, change",
        ],
        action: { label: "Choisir une idée", href: "/tableau-de-bord/trouver-une-idee" },
      },
      {
        id: "statut",
        title: "Le statut de micro-entrepreneur, simplement",
        minutes: 5,
        minPlan: "free",
        paragraphs: [
          "Pour vendre légalement en France, le plus simple est la micro-entreprise. La déclaration est gratuite et se fait en ligne sur le guichet unique (formalites.entreprises.gouv.fr). Tu reçois ton numéro SIRET en quelques jours.",
          "Tu paies des cotisations seulement sur ce que tu encaisses : un pourcentage de ton chiffre d'affaires, qui dépend de ton activité (vente de marchandises, services…). Pas de chiffre d'affaires, pas de cotisations. Vérifie le taux exact sur autoentrepreneur.urssaf.fr.",
          "Garde une trace de chaque vente (date, client, montant) dès le premier euro. BookSync te permet de les noter dans « Mes résultats ». Certains métiers sont réglementés : renseigne-toi avant de démarrer.",
        ],
        keyPoints: [
          "Déclaration gratuite sur le guichet unique",
          "Cotisations seulement sur ce que tu encaisses",
          "Note chaque vente dès le premier euro",
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
        title: "Fixer ton prix sans te sous-estimer",
        minutes: 5,
        minPlan: "starter",
        paragraphs: [
          "L'erreur la plus fréquente des débutants : vendre trop peu cher. Un prix trop bas attire les clients difficiles et ne te permet pas de continuer.",
          "Calcule d'abord ton coût : matière, frais de la plateforme, cotisations, et surtout ton temps. Ajoute ta marge. Puis regarde toi-même 3 offres comparables en ligne pour vérifier que tu restes cohérent.",
          "Commence avec un prix de lancement pour tes 3 à 5 premiers clients, en échange d'un avis. Ensuite, passe à ton vrai prix. Annonce-le clairement : un prix affiché rassure.",
        ],
        keyPoints: [
          "Coût + temps + marge = ton prix",
          "Prix de lancement pour les premiers, en échange d'un avis",
          "Affiche toujours ton prix",
        ],
        action: { label: "Analyser mon produit", href: "/tableau-de-bord/produits" },
      },
      {
        id: "premiers-clients",
        title: "Trouver tes 10 premiers clients",
        minutes: 6,
        minPlan: "starter",
        paragraphs: [
          "Tes 10 premiers clients ne viendront pas d'une vidéo virale. Ils viennent presque toujours de ton entourage, de leurs recommandations et de conversations directes.",
          "Fais une liste de 30 personnes que tu connais (famille, amis, anciens collègues, voisins) et envoie à chacune un message personnel : ce que tu lances, pour qui, et une question simple (« tu connais quelqu'un que ça pourrait aider ? »).",
          "En parallèle, va là où sont tes clients : groupes Facebook de ta ville ou de ton thème, forums, commerces du quartier. Aide d'abord, propose ensuite.",
        ],
        keyPoints: [
          "Les premiers clients viennent du bouche-à-oreille",
          "30 messages personnels, pas de copier-coller",
          "Aide d'abord, propose ensuite",
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
          "Parle du résultat, pas de toi. « Je suis passionné » intéresse moins que « tu gagnes 3 heures par semaine ».",
          "Ajoute ce qui rassure : ce qui est inclus, le délai, le prix, comment te contacter. Ne promets jamais un résultat que tu ne peux pas garantir.",
        ],
        keyPoints: [
          "C'est quoi, pour qui, qu'est-ce que ça change",
          "Parle du résultat pour le client",
          "Rassure sans promettre l'impossible",
        ],
        action: { label: "Améliorer ma page de vente", href: "/tableau-de-bord/sales-booster" },
      },
      {
        id: "vendre-message",
        title: "Vendre par message sans être lourd",
        minutes: 4,
        minPlan: "starter",
        paragraphs: [
          "Vendre, ce n'est pas forcer. C'est aider quelqu'un à décider. Commence par une question sur son besoin, écoute, puis propose ta solution si elle correspond.",
          "Réponds vite, simplement, et termine toujours par une étape claire : « Je te réserve une place ? » ou « Je t'envoie le lien de paiement ? ».",
          "Si la personne dit non ou ne répond pas, relance une seule fois, gentiment, quelques jours plus tard. Puis passe à la suivante.",
        ],
        keyPoints: [
          "Questionne d'abord, propose ensuite",
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
        title: "Les réseaux sociaux sans montrer ton visage",
        minutes: 5,
        minPlan: "starter",
        paragraphs: [
          "Tu n'as pas besoin de te filmer pour vendre. Tes mains, ton écran, ton produit, ta voix ou du texte à l'écran suffisent.",
          "Choisis un seul réseau pour commencer (souvent TikTok) et publie régulièrement : une vidéo par jour pendant 30 jours t'apprendra plus que n'importe quelle formation.",
          "Chaque vidéo doit apporter quelque chose : un conseil, une coulisse, un avant/après, une réponse à une question. Termine en disant où trouver ton offre.",
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
          "Les gens décident en 2 ou 3 secondes s'ils regardent ta vidéo. La première phrase et le texte à l'écran font presque tout.",
          "Des accroches qui marchent souvent : une question (« Tu fais encore cette erreur ? »), une promesse précise et honnête (« 3 idées pour vendre sans stock »), ou un résultat montré tout de suite.",
          "Regarde tes statistiques : garde les accroches qui retiennent le plus et réutilise-les avec un nouveau sujet.",
        ],
        keyPoints: [
          "Tout se joue dans les 3 premières secondes",
          "Question, promesse honnête ou résultat montré",
          "Réutilise les accroches qui marchent",
        ],
        action: { label: "Créer une publicité", href: "/tableau-de-bord/publicites" },
      },
      {
        id: "avis",
        title: "Récolter des avis et des preuves",
        minutes: 3,
        minPlan: "starter",
        paragraphs: [
          "Les gens achètent plus facilement quand d'autres ont déjà acheté. Après chaque vente, demande un avis en une phrase et, si possible, une photo.",
          "Demande l'accord de la personne avant de publier son avis. Ne crée jamais de faux avis : c'est interdit et ça détruit la confiance.",
          "Rassemble tes avis à un seul endroit (une story à la une, une page) et cite-les dans tes contenus.",
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
        title: "Est-ce que tu gagnes vraiment de l'argent ?",
        minutes: 5,
        minPlan: "starter",
        paragraphs: [
          "Le chiffre d'affaires, c'est ce que tu encaisses. Ce que tu gagnes vraiment, c'est ce qui reste après les achats, les frais, la publicité, les abonnements et les cotisations.",
          "Fais le calcul une fois par mois : chiffre d'affaires moins toutes tes dépenses. Si c'est positif, tu es rentable. Si c'est négatif, regarde quelle dépense ne rapporte rien.",
          "Note tes ventes et tes dépenses dans « Mes résultats » : BookSync calcule ton coût par vente et ton retour sur dépense quand tu as les chiffres.",
        ],
        keyPoints: [
          "Ce qui compte, c'est ce qui reste",
          "Fais le calcul chaque mois",
          "Coupe ce qui ne rapporte rien",
        ],
        action: { label: "Saisir mes résultats", href: "/tableau-de-bord/resultats" },
      },
      {
        id: "rentabiliser-abonnement",
        title: "Rentabiliser ton abonnement dès ce mois-ci",
        minutes: 3,
        minPlan: "starter",
        paragraphs: [
          "Ton abonnement est ta première dépense de business. Ton premier objectif chiffré est simple : faire au moins autant de ventes que ce qu'il te coûte.",
          "Pour Starter à 9,99 €, une seule vente d'un service à 15 € suffit. Sur ton accueil, la jauge « Rentabiliser mon abonnement » se remplit à chaque vente que tu notes.",
          "Rien n'est garanti : ça dépend de ce que tu mets en place. Mais si tu suis ton Autopilot chaque jour, tu te donnes les meilleures chances.",
        ],
        keyPoints: [
          "Objectif 1 : ventes ≥ prix de l'abonnement",
          "Note chaque vente pour remplir ta jauge",
          "Suis ton Autopilot chaque jour",
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
        title: "Lancer ta première publicité sans te ruiner",
        minutes: 6,
        minPlan: "pro",
        paragraphs: [
          "Ne paie jamais de publicité sur un contenu qui n'a pas déjà un peu marché gratuitement. La pub amplifie ce qui marche, elle ne répare pas ce qui ne marche pas.",
          "Fixe une limite avant de commencer, par exemple 50 € sur 10 jours, et ne la dépasse pas. Teste 2 ou 3 variantes en même temps et garde la meilleure.",
          "Calcule ton coût par client : dépense divisée par le nombre de ventes. Si un client te coûte plus que ce qu'il te rapporte, arrête et améliore ton offre d'abord.",
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
        title: "Augmenter tes prix",
        minutes: 4,
        minPlan: "pro",
        paragraphs: [
          "Quand tu as plus de demandes que de temps, c'est le signal pour augmenter tes prix. Tu gagnes autant en travaillant moins, ou plus en travaillant autant.",
          "Augmente par paliers (10 à 20 %), annonce-le à l'avance à tes clients actuels, et garde l'ancien prix quelques semaines pour eux si tu veux les remercier.",
          "Ajoute de la valeur visible en même temps : un bonus, un délai plus court, un suivi.",
        ],
        keyPoints: [
          "Trop de demandes = augmente tes prix",
          "Par paliers, annoncé à l'avance",
          "Ajoute de la valeur visible",
        ],
        action: { label: "Modifier mon produit", href: "/tableau-de-bord/produits" },
      },
      {
        id: "fideliser",
        title: "Fidéliser : vendre à nouveau aux mêmes clients",
        minutes: 4,
        minPlan: "pro",
        paragraphs: [
          "Il est bien plus facile de revendre à un client content que d'en trouver un nouveau. Garde le contact : un message pour prendre des nouvelles, une offre réservée aux anciens clients.",
          "Propose une suite logique : un deuxième service, un pack, un abonnement mensuel. Demande à tes clients ce qu'ils aimeraient que tu proposes.",
          "Un client satisfait est aussi ton meilleur commercial : propose-lui une réduction s'il te recommande à un ami.",
        ],
        keyPoints: [
          "Revendre coûte moins cher que trouver",
          "Propose une suite logique",
          "Récompense les recommandations",
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
