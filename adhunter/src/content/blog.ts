export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string };

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readingMinutes: number;
  category: string;
  blocks: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "utiliser-meta-ad-library-analyse-concurrentielle",
    title: "Comment utiliser la Meta Ad Library pour analyser tes concurrents",
    description:
      "La bibliothèque publicitaire de Meta est une mine d'informations gratuite et légale. Voici une méthode simple pour l'exploiter sans tomber dans les pièges classiques.",
    date: "2026-09-22",
    readingMinutes: 7,
    category: "Analyse concurrentielle",
    blocks: [
      { type: "p", text: "Depuis l'entrée en vigueur du Digital Services Act (DSA), Meta rend publiques les publicités diffusées dans l'Union européenne via sa bibliothèque publicitaire. Pour un e-commerçant ou une agence, c'est une source de veille précieuse : tu peux voir quelles annonces une marque diffuse, depuis quand, sur quelles plateformes et avec quel message." },
      { type: "h2", text: "Ce que la bibliothèque montre… et ce qu'elle ne montre pas" },
      { type: "p", text: "Pour les publicités commerciales, la bibliothèque affiche notamment le texte de l'annonce, le visuel ou la vidéo, la page de l'annonceur, les plateformes de diffusion (Facebook, Instagram, Messenger, Audience Network) et la date de début de diffusion." },
      { type: "p", text: "En revanche, elle ne fournit ni le budget, ni le nombre de ventes, ni le taux de conversion. Méfie-toi de tout outil qui prétend connaître ces chiffres pour une publicité qui n'est pas la tienne : ce ne sont, au mieux, que des estimations très approximatives." },
      { type: "h2", text: "Une méthode en 4 étapes" },
      { type: "ol", items: [
        "Liste 5 à 10 concurrents directs et indirects, y compris des marques étrangères de ta niche.",
        "Pour chacun, relève les publicités actives et leur date de début : une annonce diffusée depuis longtemps est un signal (pas une preuve) que l'annonceur la juge utile.",
        "Classe les annonces par angle : prix, problème/solution, preuve sociale, nouveauté, garantie…",
        "Repère les angles que personne n'exploite : c'est souvent là que se trouvent tes meilleures opportunités.",
      ] },
      { type: "h2", text: "Le piège de la copie" },
      { type: "p", text: "Copier une publicité concurrente est risqué : juridiquement (droit d'auteur, marques), mais aussi stratégiquement. Ton audience la voit déjà ailleurs, et ton produit n'a pas exactement les mêmes atouts. Inspire-toi des principes — la structure de l'accroche, le rythme, le type de preuve — puis exprime-les avec ta propre proposition de valeur." },
      { type: "quote", text: "Une bonne veille publicitaire ne te dit pas quoi copier. Elle t'aide à comprendre ce que ton marché a déjà entendu, pour dire autre chose." },
      { type: "h2", text: "Gagner du temps avec AdHunter" },
      { type: "p", text: "AdHunter interroge la Meta Ad Library via son API officielle, te permet de filtrer par niche, pays, langue et période, d'enregistrer les annonces intéressantes dans des collections et de lancer une analyse IA pour en comprendre la mécanique. Les analyses sont des estimations argumentées, jamais des données de performance." },
    ],
  },
  {
    slug: "ecrire-accroche-publicitaire-efficace",
    title: "Écrire une accroche publicitaire efficace : 7 structures qui ont fait leurs preuves",
    description:
      "Sur les réseaux sociaux, tu as environ deux secondes pour capter l'attention. Voici sept structures d'accroche classiques, avec des exemples à adapter à ton produit.",
    date: "2026-09-08",
    readingMinutes: 6,
    category: "Copywriting",
    blocks: [
      { type: "p", text: "L'accroche — la première phrase d'un texte ou les premières secondes d'une vidéo — décide si la personne s'arrête ou continue de faire défiler. Elle ne doit pas tout dire : son seul objectif est de donner envie de lire ou regarder la suite." },
      { type: "h2", text: "Les 7 structures" },
      { type: "h3", text: "1. La question qui touche un problème" },
      { type: "p", text: "« Tu te réveilles fatigué même après 8 heures de sommeil ? » Elle fonctionne quand le problème est fréquent et facile à reconnaître." },
      { type: "h3", text: "2. Le bénéfice concret" },
      { type: "p", text: "« Un salon rangé en 10 minutes par jour. » Chiffré si possible, mais toujours vérifiable : n'invente pas de résultat." },
      { type: "h3", text: "3. La contre-intuition" },
      { type: "p", text: "« Arrête de boire 2 litres d'eau par jour (fais plutôt ceci). » Elle crée de la curiosité, à condition que la suite tienne la promesse." },
      { type: "h3", text: "4. La démonstration immédiate" },
      { type: "p", text: "Très puissante en vidéo : montrer le produit en action dès la première seconde, sans introduction." },
      { type: "h3", text: "5. L'appel à une identité" },
      { type: "p", text: "« Pour les parents qui télétravaillent. » Le public cible se reconnaît et se sent concerné." },
      { type: "h3", text: "6. L'avant / pendant / après" },
      { type: "p", text: "Raconter une transformation en trois temps. Attention aux règles des plateformes, très strictes sur les « avant/après » dans la santé et la beauté." },
      { type: "h3", text: "7. La preuve sociale réelle" },
      { type: "p", text: "« Déjà [nombre réel] clients en France. » Uniquement avec des chiffres vrais et vérifiables — la réglementation sur les pratiques commerciales trompeuses s'applique aussi aux publicités en ligne." },
      { type: "h2", text: "Tester plutôt que deviner" },
      { type: "p", text: "Aucune structure ne gagne à tous les coups. Écris trois à cinq accroches différentes pour la même offre, diffuse-les avec le même visuel et laisse les données de tes propres campagnes trancher. L'Ad Creator d'AdHunter génère justement cinq accroches de structures différentes pour faciliter ces tests." },
    ],
  },
  {
    slug: "tendances-publicitaires-comment-les-lire",
    title: "Tendances publicitaires : comment les lire sans se faire piéger",
    description:
      "« Produit viral », « niche explosive »… Les tendances publicitaires sont souvent mal interprétées. Voici comment distinguer un vrai signal d'un simple effet de bruit.",
    date: "2026-08-25",
    readingMinutes: 5,
    category: "Stratégie",
    blocks: [
      { type: "p", text: "Les tableaux de tendances sont séduisants : des courbes qui montent, des mots-clés qui apparaissent, des formats qui semblent dominer. Mais une tendance n'a de valeur que si l'on sait sur quoi elle repose." },
      { type: "h2", text: "Trois questions à toujours se poser" },
      { type: "ol", items: [
        "Quelle est la taille de l'échantillon ? Dix publicités observées ne permettent pas de conclure sur un marché entier.",
        "D'où viennent les données ? Une bibliothèque officielle, des recherches d'utilisateurs, des estimations ? Chaque source a ses biais.",
        "Que mesure-t-on vraiment ? Le nombre de publicités diffusées n'est pas le nombre de ventes. Beaucoup d'annonces dans une niche peut aussi signifier… beaucoup de concurrence.",
      ] },
      { type: "h2", text: "Signal ou bruit ?" },
      { type: "p", text: "Un vrai signal se répète : sur plusieurs semaines, chez plusieurs annonceurs, dans plusieurs pays. Un pic isolé est souvent le fait d'un seul gros annonceur ou d'un événement ponctuel (soldes, fête des mères, rentrée)." },
      { type: "h2", text: "Notre approche dans le Trend Radar" },
      { type: "p", text: "Le Trend Radar d'AdHunter ne présente que des comptages issus des données réellement collectées par la plateforme (recherches anonymisées et publicités observées via les API officielles), toujours accompagnés de la taille de l'échantillon. En dessous d'un seuil minimal, nous affichons simplement « données insuffisantes » plutôt qu'une tendance trompeuse. Et nous ne qualifions jamais une tendance de « virale » ou « rentable » : seules tes propres campagnes peuvent le prouver." },
    ],
  },
  {
    slug: "creer-publicite-tiktok-instagram-facebook-differences",
    title: "TikTok, Instagram, Facebook : adapter une même publicité à chaque plateforme",
    description:
      "Le même message ne s'exprime pas de la même manière sur TikTok, Instagram et Facebook. Les différences clés à connaître avant de décliner une campagne.",
    date: "2026-08-11",
    readingMinutes: 6,
    category: "Création publicitaire",
    blocks: [
      { type: "p", text: "Décliner une campagne sur plusieurs plateformes ne consiste pas à recadrer la même vidéo. Chaque réseau a ses codes, son rythme et ses attentes. Une publicité qui semble « native » sur une plateforme peut paraître déplacée sur une autre." },
      { type: "h2", text: "TikTok : le natif avant tout" },
      { type: "ul", items: [
        "Format vertical 9:16, son activé par défaut.",
        "Les contenus qui ressemblent à des vidéos de créateurs fonctionnent souvent mieux que les productions très léchées.",
        "Accroche dans la première seconde, texte à l'écran, rythme rapide.",
      ] },
      { type: "h2", text: "Instagram : l'esthétique et la cohérence" },
      { type: "ul", items: [
        "Reels en 9:16, posts en 4:5 ou 1:1, Stories plein écran.",
        "Le visuel compte énormément : couleurs, lumière, cohérence avec l'univers de marque.",
        "Les carrousels sont efficaces pour expliquer un produit étape par étape.",
      ] },
      { type: "h2", text: "Facebook : le texte a encore sa place" },
      { type: "ul", items: [
        "Une audience souvent plus large en âge, sensible aux bénéfices concrets.",
        "Les textes plus longs, qui racontent une histoire ou répondent aux objections, peuvent bien fonctionner.",
        "Le titre et la description du lien jouent un rôle important dans le fil d'actualité.",
      ] },
      { type: "h2", text: "Une base commune, trois exécutions" },
      { type: "p", text: "Garde la même proposition de valeur et le même angle, puis adapte la forme : durée, ton, longueur du texte, format. C'est exactement ce que fait l'Ad Creator d'AdHunter en générant une variante dédiée pour TikTok, Instagram et Facebook à partir de la description de ton produit." },
    ],
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}
