import type { Tables } from "@/types/database";

type Product = Tables<"products">;

const OBJECTIVE_LABELS: Record<string, string> = {
  first_customers: "Obtenir ses premiers clients",
  increase_sales: "Augmenter ses ventes",
  launch_product: "Lancer son produit",
  grow_audience: "Développer son audience",
  find_positioning: "Trouver son positionnement",
};

export function buildGenerationPrompt(product: Product) {
  const objectiveLabel = product.objective ? OBJECTIVE_LABELS[product.objective] : "Non précisé";

  const system = `Tu es un stratège marketing senior spécialisé dans le lancement de produits digitaux et physiques pour indépendants et petites équipes. Tu écris en français.

Règle absolue : chaque recommandation doit être CONCRÈTE, PERSONNALISÉE au produit fourni, et RÉALISABLE avec les ressources décrites (budget, temps, réseaux). Il est interdit de donner des conseils génériques du type "publie régulièrement sur les réseaux sociaux" ou "fais du contenu de qualité". À la place, donne des instructions précises : quelle plateforme, quel format, quel jour, quelle accroche mot pour mot, quel élément du produit montrer, quel CTA exact.

Ne jamais inventer de statistiques de marché précises, de témoignages clients, ou de chiffres de résultats garantis. Le persona et les hypothèses marketing doivent être présentés comme des hypothèses raisonnées, pas des faits vérifiés. Ne jamais recommander de fausses preuves sociales, faux avis, ou fausse urgence.

Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown, conforme exactement au schéma demandé par l'utilisateur.`;

  const user = `Voici les informations du produit à analyser :

PRODUIT
- Nom : ${product.name}
- Description : ${product.description}
- Catégorie : ${product.category}
- URL : ${product.url || "Non fournie"}

CLIENT CIBLE
- Client visé : ${product.target_customer || "Non précisé"}
- Âge approximatif : ${product.target_age || "Non précisé"}
- Marché / pays : ${product.target_market || "Non précisé"}
- Problème principal résolu : ${product.main_problem || "Non précisé"}

BUSINESS
- Prix : ${product.price ?? "Non précisé"}
- Modèle économique : ${product.business_model || "Non précisé"}
- Plateforme de vente : ${product.sales_platform || "Non précisé"}
- Marge approximative : ${product.margin ?? "Non précisée"}
- Objectif mensuel : ${product.monthly_goal || "Non précisé"}

RESSOURCES
- Budget marketing : ${product.marketing_budget || "Non précisé"}
- Temps disponible par semaine : ${product.weekly_time_hours ?? "Non précisé"} heures
- Réseaux sociaux utilisés : ${product.social_networks?.length ? product.social_networks.join(", ") : "Aucun"}
- Audience existante : ${product.existing_audience || "Aucune"}

OBJECTIF PRINCIPAL
${objectiveLabel}

---

Génère un plan marketing complet en JSON avec exactement cette structure (respecte les noms de clés et les types) :

{
  "score": number (0-100, "Marketing Readiness Score"),
  "summary": string (2-3 phrases résumant l'état marketing actuel),
  "subscores": [ // exactement 6 objets, un par axe listé
    {
      "axis": "positioning" | "offer" | "acquisition" | "content" | "conversion" | "social_proof",
      "label": string (nom lisible en français, ex "Positionnement"),
      "score": number (0-100),
      "problem": string (problème concret identifié pour CE produit),
      "recommendation": string (action concrète et personnalisée),
      "priority": "haute" | "moyenne" | "basse"
    }
  ],
  "persona": {
    "profile_summary": string,
    "main_problem": string,
    "goals": string[] (3-5),
    "frustrations": string[] (3-5),
    "motivations": string[] (3-5),
    "objections": string[] (3-5),
    "where_to_find": string[] (3-5, canaux/communautés précis),
    "content_consumed": string[] (3-5)
  },
  "positioning": {
    "value_proposition": string (une phrase claire),
    "problem": string,
    "solution": string,
    "differentiation": string,
    "main_benefit": string,
    "elevator_pitch": string (2-3 phrases),
    "selling_points": string[] (entre 5 et 10 arguments de vente spécifiques au produit)
  },
  "offer": {
    "main_offer": string,
    "bonuses": string[] (bonus réalistes et cohérents avec le produit, peut être vide),
    "guarantee": string | null (garantie raisonnable et honnête, jamais fausse),
    "urgency": string | null (urgence légitime seulement si applicable, ex places limitées réelles, sinon null),
    "cta": string,
    "objections": [ { "objection": string, "response": string } ] (3-5)
  },
  "acquisition_strategies": [ // entre 6 et 10 stratégies, mélange "free" et "small_budget" adaptées au budget réel du client
    {
      "budget_tier": "free" | "small_budget",
      "channel": string (ex "TikTok", "Reddit", "SEO", "Micro-influenceurs"),
      "description": string (stratégie précise pour ce produit),
      "difficulty": "facile" | "moyen" | "difficile",
      "cost": string,
      "time_required": string,
      "potential": "faible" | "moyen" | "eleve",
      "first_action": string (LA toute première action à faire, très concrète)
    }
  ],
  "content_ideas": [ // exactement 30 idées de contenu concrètes et variées
    {
      "platform": string (ex "TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn", "Blog"),
      "format": string,
      "hook": string (accroche mot pour mot, percutante),
      "subject": string,
      "script": string (script exploitable de plusieurs phrases, structuré: accroche, développement, CTA),
      "cta": string,
      "objective": string
    }
  ],
  "calendar": [ // exactement 30 jours, day_number de 1 à 30, actions progressives et cohérentes avec les content_ideas et strategies
    {
      "day_number": number,
      "objective": string,
      "task": string (action précise du jour),
      "duration_minutes": number,
      "platform": string,
      "expected_result": string
    }
  ],
  "first_customer_actions": {
    "today": string[] (exactement 3 actions ultra concrètes à faire aujourd'hui),
    "week": string[] (entre 5 et 10 actions pour cette semaine),
    "month": string[] (au moins 4 actions structurant le mois complet)
  },
  "emails": [ // exactement 5, un de chaque type dans cet ordre
    { "email_type": "launch", "subject": string, "body": string },
    { "email_type": "intro", "subject": string, "body": string },
    { "email_type": "follow_up", "subject": string, "body": string },
    { "email_type": "recovery", "subject": string, "body": string },
    { "email_type": "loyalty", "subject": string, "body": string }
  ],
  "ads": [ // exactement 5 concepts publicitaires variés (plateformes différentes si pertinent)
    {
      "platform": string,
      "angle": string,
      "hook": string,
      "primary_text": string,
      "headline": string,
      "cta": string,
      "target_audience": string
    }
  ]
}

Réponds uniquement avec ce JSON, rien d'autre.`;

  return { system, user };
}
