export type BlogBlock = { type: "h2"; text: string } | { type: "p"; text: string } | { type: "ul"; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readMinutes: number;
  excerpt: string;
  cta: { label: string; to: string };
  body: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "programme-musculation-debutant",
    title: "Programme musculation débutant : par où commencer (guide gratuit)",
    description:
      "Tu veux commencer la musculation mais tu ne sais pas par où débuter ? Voici les principes essentiels et un programme simple pour bien démarrer, sans te blesser.",
    publishedAt: "2026-08-27",
    readMinutes: 6,
    excerpt:
      "Les principes essentiels pour bien débuter en musculation, sans te blesser et sans perdre de temps sur des détails qui ne comptent pas encore.",
    cta: { label: "Voir le programme complet (ebook Bases de la Musculation)", to: "/guide-musculation-debutant" },
    body: [
      {
        type: "p",
        text: "Commencer la musculation peut vite donner l'impression de devoir tout apprendre en même temps : quel exercice faire, combien de séries, quel poids choisir, à quelle fréquence s'entraîner. La bonne nouvelle, c'est qu'au début, seuls quelques principes comptent vraiment — le reste peut attendre.",
      },
      { type: "h2", text: "1. La technique avant la charge" },
      {
        type: "p",
        text: "Un mouvement bien exécuté avec une charge légère construit du muscle et évite les blessures. Une charge lourde mal exécutée ne fait ni l'un ni l'autre. Les premières semaines, l'objectif n'est pas de soulever lourd — c'est d'apprendre le mouvement.",
      },
      { type: "h2", text: "2. La surcharge progressive" },
      {
        type: "p",
        text: "Le muscle progresse quand on lui demande légèrement plus que la fois précédente : un peu plus de poids, ou une répétition de plus. Sans cette progression lente et régulière, l'entraînement stagne — même en s'entraînant dur.",
      },
      { type: "h2", text: "3. La régularité bat l'intensité" },
      {
        type: "p",
        text: "Trois séances par semaine tenues sur deux mois valent largement mieux qu'une semaine parfaite suivie de deux semaines sautées. Mieux vaut un rythme modeste mais tenable qu'un programme ambitieux abandonné au bout de 10 jours.",
      },
      { type: "h2", text: "Un point de départ simple : le full-body" },
      {
        type: "p",
        text: "Pour débuter, un programme full-body (tout le corps travaillé à chaque séance) 3 fois par semaine est un excellent choix : squat, développé, tirage, gainage — 3 à 4 séries de 8 à 12 répétitions par exercice, avec 60 à 90 secondes de repos entre les séries. Ce format simple couvre l'essentiel sans surcharger ton emploi du temps.",
      },
      {
        type: "ul",
        items: [
          "Échauffe-toi 5 à 10 minutes avant chaque séance (cardio léger + mobilité)",
          "Note tes poids et répétitions à chaque séance — c'est le seul moyen fiable de savoir si tu progresses",
          "Augmente le poids seulement quand la technique est solide sur toutes les répétitions",
          "Compte en mois, pas en semaines : les premiers changements visibles arrivent généralement après 8 à 12 semaines de régularité",
        ],
      },
      {
        type: "p",
        text: "Si tu veux un programme détaillé sur 4 semaines (séances complètes, séries, repos, erreurs de débutant à éviter), l'ebook Bases de la Musculation reprend tout ça pas à pas.",
      },
    ],
  },
  {
    slug: "perdre-du-poids-sans-se-priver",
    title: "Comment perdre du poids sans se priver : le guide complet",
    description:
      "Perdre du poids sans régime strict, c'est possible. Voici comment fonctionne réellement la perte de poids, et comment construire une routine que tu peux tenir dans la durée.",
    publishedAt: "2026-08-27",
    readMinutes: 7,
    excerpt:
      "La perte de poids durable ne passe pas par la privation. Voici ce qui compte vraiment, et comment construire une routine que tu peux tenir sur la durée.",
    cta: { label: "Voir les recettes (ebook Recettes Régime)", to: "/recettes-regime" },
    body: [
      {
        type: "p",
        text: "La plupart des régimes stricts échouent pour une raison simple : ils sont impossibles à tenir plus de quelques semaines. Comprendre les vrais mécanismes de la perte de poids permet de construire une approche que tu peux réellement suivre sur la durée, sans te priver en permanence.",
      },
      { type: "h2", text: "Le principe de base : le déficit calorique" },
      {
        type: "p",
        text: "Perdre du poids demande de consommer légèrement moins d'énergie que ce que le corps dépense. C'est le seul mécanisme qui compte réellement — pas un aliment magique, pas un horaire de repas précis. Un déficit modéré (environ 300 à 500 kcal par jour en dessous de tes besoins) est largement suffisant, et bien plus facile à tenir qu'un déficit sévère.",
      },
      { type: "h2", text: "Pourquoi les régimes stricts échouent" },
      {
        type: "p",
        text: "Un déficit trop important pousse le corps à economiser de l'énergie (fatigue, faim intense, métabolisme qui ralentit), et rend la tentation de tout arrêter beaucoup plus forte. Résultat : la perte de poids s'arrête, puis le poids reprend souvent une fois le régime terminé — le fameux effet yo-yo.",
      },
      { type: "h2", text: "Ce qui fonctionne réellement" },
      {
        type: "ul",
        items: [
          "Privilégier les protéines à chaque repas : elles rassasient davantage et aident à préserver le muscle pendant la perte de poids",
          "Garder des repas que tu aimes réellement manger, plutôt que de tout miser sur des aliments \"diététiques\" que tu n'apprécies pas",
          "Bouger régulièrement (marche, sport) plutôt que viser des séances extrêmes ponctuelles",
          "Dormir suffisamment : en dessous de 6-7h de sommeil régulier, la faim augmente et la perte de poids devient nettement plus difficile",
          "Mesurer ta progression autrement que sur la balance seule (photo, tour de taille) — le poids varie avec la rétention d'eau et masque souvent les vrais progrès",
        ],
      },
      { type: "h2", text: "Construire une routine tenable" },
      {
        type: "p",
        text: "La question à te poser n'est pas \"quel est le régime le plus efficace\", mais \"quelle routine suis-je capable de tenir pendant 3 mois\". Une routine modérée tenue durablement produit toujours plus de résultats qu'un régime parfait abandonné au bout de 2 semaines.",
      },
      {
        type: "p",
        text: "Si tu cherches des idées de repas concrètes, riches en protéines et faciles à préparer pour rester dans cette logique sans y passer des heures, l'ebook Recettes Régime propose 20 recettes pensées exactement pour ça.",
      },
    ],
  },
  {
    slug: "pas-de-resultats-sport",
    title: "Pourquoi tu ne vois pas de résultats malgré tes efforts",
    description:
      "Tu t'entraînes régulièrement mais tu ne vois aucun résultat ? Voici les raisons les plus fréquentes, et ce qui bloque probablement ta progression.",
    publishedAt: "2026-08-27",
    readMinutes: 6,
    excerpt:
      "Tu t'entraînes régulièrement mais rien ne bouge ? Voici les raisons les plus fréquentes qui expliquent ce blocage, et comment le débloquer.",
    cta: { label: "Voir le programme complet (ebook Transformation 90 Jours)", to: "/ebook" },
    body: [
      {
        type: "p",
        text: "S'entraîner régulièrement sans voir de résultats est l'une des situations les plus frustrantes et les plus décourageantes. Dans la grande majorité des cas, ce n'est pas un problème de volonté — c'est un ou deux réglages précis qui bloquent toute la progression.",
      },
      { type: "h2", text: "1. Tu mesures le mauvais indicateur" },
      {
        type: "p",
        text: "Le poids sur la balance varie fortement avec la rétention d'eau, le cycle, la digestion ou le sel de la veille — il peut masquer des progrès réels pendant plusieurs semaines. Une photo et un tour de taille toutes les deux semaines donnent une image bien plus fiable de ce qui change réellement.",
      },
      { type: "h2", text: "2. Le sommeil est négligé" },
      {
        type: "p",
        text: "C'est pendant le sommeil que le corps répare le muscle sollicité à l'entraînement et régule les hormones liées à l'appétit et à la récupération. En dessous de 6-7h de sommeil régulier, ajouter des séances supplémentaires n'apporte généralement que peu de bénéfice : le corps ne récupère pas assez pour en profiter.",
      },
      { type: "h2", text: "3. Il n'y a pas de vraie progression" },
      {
        type: "p",
        text: "Refaire toujours le même entraînement, avec les mêmes poids, fait stagner par définition. Le corps s'adapte à une charge de travail constante — sans y ajouter légèrement plus au fil du temps (poids, répétitions, volume), il n'a aucune raison de continuer à changer.",
      },
      { type: "h2", text: "4. Le temps nécessaire est sous-estimé" },
      {
        type: "p",
        text: "Les premiers changements de force apparaissent en 2 à 3 semaines, mais les changements visibles à l'œil demandent généralement 8 à 12 semaines de régularité — parfois plus selon le point de départ. Beaucoup abandonnent juste avant que les résultats deviennent visibles.",
      },
      { type: "h2", text: "5. La nutrition n'est pas alignée avec l'objectif" },
      {
        type: "p",
        text: "Un entraînement sérieux sans nutrition adaptée ne donne que la moitié du résultat possible. Ce n'est pas une question de régime parfait, mais d'avoir un apport cohérent avec ton objectif (déficit pour perdre du poids, surplus pour prendre de la masse) de façon suffisamment régulière.",
      },
      {
        type: "p",
        text: "Si plusieurs de ces points te parlent, la solution n'est généralement pas de t'entraîner plus dur, mais de corriger un ou deux réglages en même temps. C'est exactement l'approche du programme Transformation 90 Jours : entraînement, nutrition, sommeil et suivi réunis dans un seul plan structuré.",
      },
    ],
  },
  {
    slug: "programme-sport-maison-sans-materiel",
    title: "Programme sport à la maison sans matériel : comment bien commencer",
    description:
      "Pas de salle de sport ni de matériel ? Voici comment construire une vraie routine efficace à la maison, avec les mouvements qui comptent réellement.",
    publishedAt: "2026-08-27",
    readMinutes: 6,
    excerpt:
      "Pas besoin de salle ni de matériel pour progresser. Voici les mouvements qui comptent vraiment et comment structurer une séance efficace à la maison.",
    cta: { label: "Voir le programme complet (ebook Cardio & Renfo Sans Matériel)", to: "/programme-maison-sans-materiel" },
    body: [
      {
        type: "p",
        text: "Manque de temps, pas d'abonnement en salle, pas de matériel à la maison : ce sont les excuses les plus courantes pour ne pas s'entraîner. Le problème, c'est qu'elles ne tiennent pas vraiment — le poids du corps suffit largement pour progresser, à condition de structurer les séances correctement.",
      },
      { type: "h2", text: "Le poids du corps suffit pour progresser" },
      {
        type: "p",
        text: "Un muscle ne fait pas la différence entre une barre de musculation et ton propre poids : ce qui compte, c'est l'effort demandé par rapport à ta capacité actuelle. Au début, squats, pompes et fentes suffisent amplement à créer une vraie surcharge. Le matériel devient utile seulement quand le poids du corps devient trop facile — ce qui prend en général plusieurs mois de pratique régulière.",
      },
      { type: "h2", text: "Les mouvements qui comptent vraiment" },
      {
        type: "ul",
        items: [
          "Squat (bas du corps) — jambes et fessiers",
          "Pompes (haut du corps) — pectoraux, épaules, triceps",
          "Fentes — jambes en unilatéral, utile pour l'équilibre et la stabilité",
          "Gainage (planche) — sangle abdominale et posture",
          "Mountain climbers ou jumping jacks — volet cardio",
        ],
      },
      { type: "h2", text: "Comment structurer une séance sans matériel" },
      {
        type: "p",
        text: "Le format le plus simple et le plus efficace est le circuit : enchaîner 4 à 6 exercices l'un après l'autre avec un court repos entre chaque, puis répéter le circuit 2 à 4 fois selon ton niveau. Compte environ 30 à 45 secondes d'effort par exercice et 15 à 30 secondes de repos entre chaque mouvement. Trois séances de 20 à 30 minutes par semaine suffisent pour progresser sérieusement.",
      },
      { type: "h2", text: "Progresser sans ajouter de poids" },
      {
        type: "p",
        text: "Sans charges additionnelles, la progression passe par d'autres leviers : plus de répétitions, moins de temps de repos, un tempo plus lent (descendre en 3 secondes plutôt qu'en 1), ou des variantes plus difficiles (pompes surélevées aux pieds, squat sauté, gainage avec levée de jambe). L'essentiel est le même qu'en salle : demander un peu plus qu'à la séance précédente, régulièrement.",
      },
      {
        type: "p",
        text: "Si tu veux un programme complet sur 4 semaines, avec deux circuits progressifs prêts à suivre sans réfléchir à la structure à chaque fois, l'ebook Cardio & Renfo Sans Matériel couvre exactement ça.",
      },
    ],
  },
  {
    slug: "quoi-manger-pour-prendre-du-muscle",
    title: "Prise de masse : quoi manger pour prendre du muscle (sans grossir n'importe comment)",
    description:
      "Prendre du muscle sans stocker n'importe quoi n'importe comment : voici comment fonctionne réellement la prise de masse et ce qui compte dans l'assiette.",
    publishedAt: "2026-08-27",
    readMinutes: 6,
    excerpt:
      "Prendre du muscle sans prendre n'importe quoi n'importe comment. Voici comment fonctionne réellement la prise de masse et ce qui compte dans l'assiette.",
    cta: { label: "Voir les recettes (ebook Recettes Prise de Masse)", to: "/recettes-prise-de-masse" },
    body: [
      {
        type: "p",
        text: "Prendre du muscle demande de manger plus que ce dont le corps a besoin au quotidien — mais \"manger plus\" au hasard mène surtout à prendre du gras, pas du muscle. Quelques principes simples font toute la différence entre une vraie prise de masse et un simple surplus de calories mal utilisé.",
      },
      { type: "h2", text: "Le principe de base : le surplus calorique" },
      {
        type: "p",
        text: "Construire du muscle demande de l'énergie disponible en plus des besoins normaux du corps. Un surplus modéré (environ 200 à 400 kcal par jour au-dessus de tes besoins) est largement suffisant pour progresser, et permet de limiter la prise de gras inutile qui accompagne souvent les surplus trop agressifs.",
      },
      { type: "h2", text: "Les protéines, la priorité n°1" },
      {
        type: "p",
        text: "C'est l'élément le plus important de l'alimentation en prise de masse : viser environ 1,6 à 2,2 g de protéines par kilo de poids de corps chaque jour. Les protéines fournissent les briques nécessaires à la construction musculaire — sans un apport suffisant, l'entraînement seul ne suffit pas à progresser, même avec un bon programme.",
      },
      { type: "h2", text: "Pourquoi un surplus trop agressif est contre-productif" },
      {
        type: "p",
        text: "Manger beaucoup plus que nécessaire ne fait pas construire du muscle plus vite : le corps ne peut synthétiser qu'une quantité limitée de muscle sur une période donnée. Le reste de l'excédent est simplement stocké sous forme de graisse. Résultat : plus de gras à perdre ensuite, pour un gain de muscle qui n'a pas été plus rapide.",
      },
      { type: "h2", text: "Ce qui compte au quotidien" },
      {
        type: "ul",
        items: [
          "Répartir les protéines sur 3 à 4 repas dans la journée plutôt que tout concentrer sur un seul repas",
          "Ne pas négliger les glucides : ils fournissent l'énergie nécessaire pour bien s'entraîner et récupérer entre les séances",
          "Suivre l'évolution du poids sur plusieurs semaines (environ 0,25 à 0,5 kg par semaine est un rythme raisonnable) plutôt qu'au jour le jour",
          "Ajuster l'apport si le poids stagne trop longtemps, ou au contraire grimpe trop vite",
        ],
      },
      {
        type: "p",
        text: "Si tu veux des repas concrets et caloriques déjà pensés pour cet équilibre (protéines suffisantes, apport calorique cohérent, sans passer des heures à cuisiner), l'ebook Recettes Prise de Masse propose 20 recettes construites exactement pour ça.",
      },
    ],
  },
  {
    slug: "sommeil-recuperation-sport",
    title: "Sommeil et récupération : pourquoi tu ne progresses pas si tu dors mal",
    description:
      "Le sommeil est souvent le facteur le plus négligé de la progression sportive. Voici pourquoi il compte autant que l'entraînement et la nutrition, et comment l'améliorer.",
    publishedAt: "2026-08-27",
    readMinutes: 6,
    excerpt:
      "Le sommeil est souvent le facteur le plus négligé de la progression. Voici pourquoi il compte autant que l'entraînement, et comment l'améliorer concrètement.",
    cta: { label: "Voir le guide complet (ebook Dors Mieux, Progresse Plus Vite)", to: "/guide-sommeil-recuperation" },
    body: [
      {
        type: "p",
        text: "Entraînement sérieux, alimentation adaptée — et pourtant, la progression stagne. Dans beaucoup de cas, le facteur qui manque n'est ni dans la salle ni dans l'assiette : c'est le sommeil, souvent le premier réglage sacrifié quand l'emploi du temps se resserre.",
      },
      { type: "h2", text: "Ce qui se passe pendant le sommeil" },
      {
        type: "p",
        text: "C'est pendant le sommeil profond que le corps répare les fibres musculaires sollicitées à l'entraînement et sécrète une grande partie de l'hormone de croissance impliquée dans cette réparation. Sans sommeil suffisant, l'entraînement continue de créer du stress sur le muscle, mais la phase de récupération qui permet d'en tirer un bénéfice réel est incomplète.",
      },
      { type: "h2", text: "Le lien entre sommeil et faim" },
      {
        type: "p",
        text: "Le manque de sommeil dérègle les hormones qui contrôlent l'appétit (ghréline et leptine), ce qui augmente la faim et les fringales — en particulier pour les aliments très caloriques. Que l'objectif soit de perdre du poids ou d'en prendre proprement, un sommeil insuffisant rend l'alimentation beaucoup plus difficile à maîtriser.",
      },
      { type: "h2", text: "Combien d'heures faut-il vraiment ?" },
      {
        type: "p",
        text: "La plupart des adultes ont besoin d'environ 7 à 9 heures de sommeil par nuit pour récupérer correctement. En dessous de 6-7h de façon régulière, la récupération musculaire, la gestion de la faim et même la performance à l'entraînement se dégradent nettement — ajouter des séances supplémentaires apporte alors très peu, voire rien, tant que ce déficit n'est pas corrigé.",
      },
      { type: "h2", text: "Améliorer la qualité du sommeil" },
      {
        type: "ul",
        items: [
          "Garder des horaires de coucher et de lever réguliers, y compris le week-end",
          "Éviter les écrans dans l'heure précédant le coucher (la lumière bleue retarde l'endormissement)",
          "Limiter la caféine en fin de journée — son effet peut durer plusieurs heures",
          "Garder la chambre fraîche et sombre, propice à un sommeil profond",
          "Éviter les séances de sport très intenses juste avant le coucher",
        ],
      },
      {
        type: "p",
        text: "Si le sommeil est ton point faible, l'ebook Dors Mieux, Progresse Plus Vite détaille concrètement comment l'améliorer et pourquoi il est aussi important que l'entraînement et la nutrition dans ta progression.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
