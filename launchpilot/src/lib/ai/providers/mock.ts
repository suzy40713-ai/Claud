import type { Tables } from "@/types/database";
import type { GenerationOutput } from "@/lib/ai/schema";

type Product = Tables<"products">;

/**
 * Deterministic, offline "AI" provider used when no ANTHROPIC_API_KEY /
 * OPENAI_API_KEY is configured. It still tailors every field to the actual
 * product data (name, target customer, platforms, budget) via templating so
 * the whole app is testable end-to-end without a live LLM key. Swapped out
 * automatically for a real provider as soon as credentials are present —
 * see `src/lib/ai/generate.ts`.
 */
export function generateMockPlan(product: Product): GenerationOutput {
  const name = product.name || "ton produit";
  const target = product.target_customer || "ton client idéal";
  const problem = product.main_problem || "un problème quotidien coûteux à ignorer";
  const platforms = product.social_networks?.length
    ? product.social_networks
    : ["TikTok", "Instagram", "YouTube Shorts"];
  const budget = product.marketing_budget || "budget limité";
  const category = product.category || "produit";

  const platformAt = (i: number) => platforms[i % platforms.length];

  const score = 58;

  const subscores: GenerationOutput["subscores"] = [
    {
      axis: "positioning",
      label: "Positionnement",
      score: 55,
      problem: `On ne comprend pas en une phrase pourquoi ${target} devrait choisir ${name} plutôt qu'une alternative.`,
      recommendation: `Reformule ta proposition de valeur autour du résultat concret que ${target} obtient, pas des fonctionnalités de ${name}.`,
      priority: "haute",
    },
    {
      axis: "offer",
      label: "Offre",
      score: 60,
      problem: "L'offre actuelle manque d'éléments de réassurance (garantie, bonus) pour déclencher la première vente.",
      recommendation: "Ajoute une garantie simple et un bonus de lancement clairement daté pour réduire la friction à l'achat.",
      priority: "haute",
    },
    {
      axis: "acquisition",
      label: "Acquisition",
      score: 50,
      problem: `Aucun canal d'acquisition n'est encore exploité de façon récurrente avec un ${budget}.`,
      recommendation: `Concentre-toi sur ${platformAt(0)} en priorité : c'est le canal gratuit avec le meilleur ratio effort/portée pour toucher ${target}.`,
      priority: "haute",
    },
    {
      axis: "content",
      label: "Contenu",
      score: 62,
      problem: "Le contenu publié ne suit pas encore de ligne éditoriale claire liée au problème résolu.",
      recommendation: `Publie 3 à 4 contenus par semaine sur ${platformAt(0)} montrant ${name} en train de résoudre "${problem}" en situation réelle.`,
      priority: "moyenne",
    },
    {
      axis: "conversion",
      label: "Conversion",
      score: 58,
      problem: `Le tunnel entre la découverte de ${name} et l'achat comporte trop d'étapes ou de flou sur l'action à faire.`,
      recommendation: "Simplifie le CTA principal à une seule action claire, répétée à chaque contenu et sur la page produit.",
      priority: "moyenne",
    },
    {
      axis: "social_proof",
      label: "Preuve sociale",
      score: 45,
      problem: "Aucune preuve sociale n'est encore visible (avis, cas d'usage, démonstration publique).",
      recommendation: "Documente publiquement les 3 premiers retours clients réels dès que tu les obtiens, sans jamais en inventer avant.",
      priority: "moyenne",
    },
  ];

  const persona: GenerationOutput["persona"] = {
    profile_summary: `Hypothèse marketing : ${target}, confronté(e) régulièrement à "${problem}", et qui cherche activement une solution pratique dans la catégorie ${category}.`,
    main_problem: problem,
    goals: [
      "Résoudre le problème sans y passer des heures",
      "Trouver une solution fiable et simple à mettre en place",
      "Ne pas payer pour quelque chose de trop complexe par rapport à son besoin",
    ],
    frustrations: [
      "A déjà essayé des solutions génériques qui ne correspondent pas à son cas",
      "Manque de temps pour comparer toutes les options du marché",
      "Se méfie des promesses marketing trop belles pour être vraies",
    ],
    motivations: [
      "Gagner du temps ou de l'argent rapidement",
      "Réduire le stress lié au problème non résolu",
      "Se sentir compétent(e) en ayant trouvé la bonne solution",
    ],
    objections: [
      `"Est-ce que ${name} va vraiment fonctionner pour mon cas précis ?"`,
      '"Le prix en vaut-il la peine par rapport à une alternative gratuite ?"',
      '"Je n\'ai pas le temps d\'apprendre un nouvel outil."',
    ],
    where_to_find: [
      `Groupes et communautés en ligne dédiés à ${category}`,
      `${platformAt(0)} via des hashtags liés à "${problem}"`,
      "Forums et sous-communautés Reddit pertinents pour ce secteur",
    ],
    content_consumed: [
      "Vidéos courtes de démonstration produit",
      "Témoignages et retours d'expérience authentiques",
      "Comparatifs et guides pratiques",
    ],
  };

  const positioning: GenerationOutput["positioning"] = {
    value_proposition: `${name} aide ${target} à résoudre "${problem}" sans complexité inutile.`,
    problem,
    solution: `${name} propose une réponse directe et accessible à ce problème, pensée pour ${target}.`,
    differentiation: `Contrairement aux alternatives génériques, ${name} est pensé spécifiquement pour le cas d'usage de ${target}.`,
    main_benefit: "Gagner du temps et obtenir un résultat concret rapidement.",
    elevator_pitch: `${name} est fait pour ${target} qui veut résoudre "${problem}" sans perdre de temps. En quelques minutes, tu obtiens un résultat concret, sans complexité superflue.`,
    selling_points: [
      `Répond directement à "${problem}"`,
      `Conçu spécifiquement pour ${target}`,
      "Mise en route rapide, sans courbe d'apprentissage longue",
      `Adapté à un usage via ${product.sales_platform || "ta plateforme de vente"}`,
      "Prix aligné avec la valeur perçue immédiate",
      "Simplicité d'utilisation dès la première session",
    ],
  };

  const offer: GenerationOutput["offer"] = {
    main_offer: `Accès à ${name} au prix de lancement${product.price ? ` de ${product.price}` : ""}.`,
    bonuses: ["Guide de démarrage rapide offert pour les 20 premiers clients"],
    guarantee: "Garantie satisfait ou remboursé sous 14 jours, sans question.",
    urgency: "Prix de lancement réservé aux 20 premiers clients réels (pas de compte à rebours artificiel).",
    cta: `Je réserve mon accès à ${name}`,
    objections: [
      { objection: "Le prix me semble élevé.", response: "Compare le coût au temps/argent perdu chaque semaine à cause du problème non résolu." },
      { objection: "Je ne suis pas sûr que ça marche pour moi.", response: "La garantie 14 jours retire le risque : tu testes sans engagement." },
      { objection: "Je n'ai pas le temps de m'y mettre.", response: "La mise en route prend moins de 15 minutes, conçue pour être immédiate." },
    ],
  };

  const acquisitionChannels: Array<{ tier: "free" | "small_budget"; channel: string }> = [
    { tier: "free", channel: platformAt(0) },
    { tier: "free", channel: platformAt(1) },
    { tier: "free", channel: "SEO / contenu de blog" },
    { tier: "free", channel: "Communautés & forums" },
    { tier: "free", channel: "Outreach direct raisonnable" },
    { tier: "small_budget", channel: `Publicités ${platformAt(0)}` },
    { tier: "small_budget", channel: "Micro-influenceurs" },
    { tier: "small_budget", channel: "Retargeting" },
  ];

  const acquisition_strategies: GenerationOutput["acquisition_strategies"] = acquisitionChannels.map(
    ({ tier, channel }, i) => ({
      budget_tier: tier,
      channel,
      description:
        tier === "free"
          ? `Publie du contenu natif sur ${channel} montrant ${name} en action pour ${target}, sans ton de vente.`
          : `Teste une petite campagne sur ${channel} avec un budget de 5 à 15€/jour ciblant ${target}.`,
      difficulty: i % 3 === 0 ? "facile" : i % 3 === 1 ? "moyen" : "difficile",
      cost: tier === "free" ? "0€ (temps uniquement)" : "5-15€/jour",
      time_required: tier === "free" ? "3-5h/semaine" : "2h de mise en place + suivi",
      potential: i < 2 ? "eleve" : "moyen",
      first_action:
        tier === "free"
          ? `Publier aujourd'hui un premier post sur ${channel} présentant le problème "${problem}".`
          : `Créer une audience de test sur ${channel} basée sur les centres d'intérêt de ${target}.`,
    })
  );

  const contentTemplates = [
    { hook: `Tu fais probablement cette erreur avec ${category}...`, objective: "Sensibiliser au problème" },
    { hook: `Voici comment ${target} peut résoudre "${problem}" en 60 secondes`, objective: "Démonstration produit" },
    { hook: `3 signes que tu as besoin de ${name}`, objective: "Qualifier l'audience" },
    { hook: `Ce que personne ne te dit sur ${category}`, objective: "Créer de la curiosité" },
    { hook: `J'ai testé ${name} pendant 7 jours, voici le résultat`, objective: "Preuve par la démonstration" },
    { hook: `Avant / après avec ${name}`, objective: "Montrer la transformation" },
    { hook: `Pourquoi j'ai créé ${name}`, objective: "Storytelling fondateur" },
    { hook: `La méthode que ${target} utilise pour éviter "${problem}"`, objective: "Éducation" },
    { hook: `Réponse à la question qu'on me pose le plus sur ${name}`, objective: "Lever une objection" },
    { hook: `Ce qui différencie ${name} de tout le reste`, objective: "Différenciation" },
  ];

  const formats = ["Vidéo face caméra", "Démonstration écran", "Carrousel", "Voix off + montage rapide", "Story interactive"];

  const content_ideas: GenerationOutput["content_ideas"] = Array.from({ length: 30 }, (_, i) => {
    const t = contentTemplates[i % contentTemplates.length];
    const platform = platformAt(i);
    return {
      platform,
      format: formats[i % formats.length],
      hook: t.hook,
      subject: `${t.objective} autour de ${name}`,
      script: `Accroche (0-3s) : "${t.hook}". Développement (3-20s) : montre ${name} en train de résoudre concrètement "${problem}" pour ${target}, avec un exemple précis à l'écran. Conclusion (20-25s) : rappelle le bénéfice principal en une phrase. CTA final : "${t.objective === "Lever une objection" ? "Envoie-moi tes questions en commentaire" : `Découvre ${name} via le lien en bio`}".`,
      cta: `Découvre ${name} via le lien en bio`,
      objective: t.objective,
    };
  });

  const calendarTasks = [
    { objective: "Poser les bases", task: `Optimiser ta bio/profil ${platformAt(0)} autour du bénéfice principal de ${name}` , platform: platformAt(0), duration: 30 },
    { objective: "Premier contenu", task: `Publier le contenu #1 (idée de contenu ci-dessus) sur ${platformAt(0)}`, platform: platformAt(0), duration: 45 },
    { objective: "Écoute active", task: `Rejoindre 2 communautés en ligne fréquentées par ${target}`, platform: "Communautés", duration: 40 },
    { objective: "Contenu régulier", task: "Publier un nouveau contenu de la liste des 30 idées", platform: platformAt(1), duration: 40 },
    { objective: "Engagement", task: `Répondre à tous les commentaires/DM reçus sur ${platformAt(0)}`, platform: platformAt(0), duration: 20 },
    { objective: "Outreach", task: `Contacter 5 personnes correspondant à ${target} avec un message personnalisé (pas de spam)`, platform: "Messages directs", duration: 45 },
    { objective: "Analyse", task: "Regarder les statistiques de la semaine et noter ce qui fonctionne", platform: "Analytics", duration: 20 },
  ];

  const calendar: GenerationOutput["calendar"] = Array.from({ length: 30 }, (_, i) => {
    const base = calendarTasks[i % calendarTasks.length];
    return {
      day_number: i + 1,
      objective: base.objective,
      task: base.task,
      duration_minutes: base.duration,
      platform: base.platform,
      expected_result:
        i < 7
          ? "Premiers signaux d'intérêt (vues, commentaires, questions)"
          : i < 20
          ? "Croissance de l'engagement et premiers échanges qualifiés"
          : "Premières conversations avancées vers un achat",
    };
  });

  const first_customer_actions: GenerationOutput["first_customer_actions"] = {
    today: [
      `Publier un post sur ${platformAt(0)} présentant "${problem}" et comment ${name} y répond`,
      `Rejoindre une communauté en ligne fréquentée par ${target}`,
      `Envoyer un message personnalisé à 3 personnes de ton réseau correspondant à ${target}`,
    ],
    week: [
      `Publier 3 à 4 contenus sur ${platformAt(0)} en suivant les idées de contenu générées`,
      "Répondre à chaque commentaire et message reçu sous 24h",
      `Contacter 10 personnes correspondant à ${target} avec un message non générique`,
      "Optimiser la page/description de vente avec la proposition de valeur générée",
      "Partager le lancement dans 2 communautés pertinentes en respectant leurs règles",
    ],
    month: [
      "Suivre le calendrier de contenu sur 30 jours",
      "Tester une stratégie gratuite et une stratégie à petit budget en parallèle",
      "Envoyer la séquence des 5 emails générés aux premiers contacts intéressés",
      "Documenter les 3 premiers retours clients réels pour construire une preuve sociale honnête",
      `Ajuster l'offre en fonction des objections réellement entendues de la part de ${target}`,
    ],
  };

  const emails: GenerationOutput["emails"] = [
    {
      email_type: "launch",
      subject: `${name} est enfin disponible`,
      body: `Bonjour,\n\nAprès plusieurs semaines de travail, ${name} est disponible dès aujourd'hui.\n\nSi tu es concerné(e) par "${problem}", c'est fait pour toi : ${positioning.value_proposition}\n\n${offer.cta} → [lien]\n\nÀ bientôt,\nL'équipe ${name}`,
    },
    {
      email_type: "intro",
      subject: `Pourquoi j'ai créé ${name}`,
      body: `Bonjour,\n\nJe voulais te partager pourquoi ${name} existe : ${positioning.problem}\n\n${positioning.solution}\n\nSi ça résonne avec ta situation, je t'invite à découvrir comment ça fonctionne → [lien]\n\nÀ bientôt.`,
    },
    {
      email_type: "follow_up",
      subject: `Tu as des questions sur ${name} ?`,
      body: `Bonjour,\n\nTu as découvert ${name} récemment. As-tu des questions avant de te lancer ?\n\nLes objections les plus fréquentes qu'on entend : "${offer.objections[0]?.objection}" — ${offer.objections[0]?.response}\n\nRéponds à cet email, je te réponds personnellement.`,
    },
    {
      email_type: "recovery",
      subject: "On a gardé ta place",
      body: `Bonjour,\n\nTu avais commencé à regarder ${name} sans finaliser. ${offer.guarantee ? `Pour rappel : ${offer.guarantee}` : ""}\n\n${offer.cta} → [lien]\n\nÀ très vite.`,
    },
    {
      email_type: "loyalty",
      subject: "Merci d'avoir choisi " + name,
      body: `Bonjour,\n\nMerci d'utiliser ${name}. Ton retour compte énormément à ce stade du lancement.\n\nSi tu as 2 minutes, réponds à cet email pour partager ton expérience — ça m'aide à améliorer le produit pour la suite.\n\nMerci encore.`,
    },
  ];

  const adPlatforms = ["Meta Ads", "TikTok Ads", "Google Ads", "Pinterest Ads", "LinkedIn Ads"];
  const ads: GenerationOutput["ads"] = Array.from({ length: 5 }, (_, i) => ({
    platform: adPlatforms[i % adPlatforms.length],
    angle: i === 0 ? "Douleur / problème" : i === 1 ? "Transformation" : i === 2 ? "Preuve par la démonstration" : i === 3 ? "Curiosité" : "Offre directe",
    hook: contentTemplates[i % contentTemplates.length].hook,
    primary_text: `${target}, si "${problem}" te parle, ${name} a été conçu pour toi. ${positioning.main_benefit}.`,
    headline: `${name} — ${positioning.main_benefit}`,
    cta: offer.cta,
    target_audience: `${target}${product.target_age ? `, ${product.target_age} ans` : ""}${product.target_market ? `, ${product.target_market}` : ""}`,
  }));

  return {
    score,
    summary: `${name} a des bases mais manque encore de preuve sociale et d'un canal d'acquisition constant. Priorité : clarifier le positionnement et publier du contenu régulier sur ${platformAt(0)} pour générer les premiers signaux.`,
    subscores,
    persona,
    positioning,
    offer,
    acquisition_strategies,
    content_ideas,
    calendar,
    first_customer_actions,
    emails,
    ads,
  };
}
