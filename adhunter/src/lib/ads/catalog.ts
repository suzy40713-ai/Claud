export interface Niche {
  id: string;
  label: string;
  /** Search terms per language used when the user picks a niche without a keyword. */
  terms: { fr: string; en: string };
  /** Lower-case stems used to classify ad text into a niche. */
  keywords: string[];
}

export const NICHES: Niche[] = [
  { id: "beaute", label: "Beauté", terms: { fr: "soin visage", en: "skincare" }, keywords: ["beauté", "beauty", "skincare", "soin", "peau", "sérum", "serum", "maquillage", "makeup", "cosmét", "crème", "cream", "cheveux", "hair", "parfum", "mascara", "rides"] },
  { id: "mode", label: "Mode", terms: { fr: "vêtements", en: "clothing" }, keywords: ["mode", "fashion", "vêtement", "clothing", "robe", "dress", "jean", "sneaker", "chaussure", "shoes", "collection", "t-shirt", "sac", "bag", "bijou", "jewelry", "montre", "watch"] },
  { id: "fitness", label: "Fitness", terms: { fr: "musculation", en: "workout" }, keywords: ["fitness", "workout", "musculation", "gym", "entraînement", "training", "protéine", "protein", "abdos", "cardio", "haltère", "coach"] },
  { id: "sport", label: "Sport", terms: { fr: "équipement sport", en: "sports gear" }, keywords: ["sport", "running", "course", "football", "vélo", "bike", "cycling", "tennis", "golf", "randonnée", "hiking", "ski", "natation", "yoga"] },
  { id: "tech", label: "Technologie", terms: { fr: "gadget", en: "gadget" }, keywords: ["tech", "gadget", "smartphone", "téléphone", "phone", "écouteur", "earbuds", "casque", "headphone", "chargeur", "charger", "laptop", "ordinateur", "app", "logiciel", "software", "ia ", "ai ", "saas"] },
  { id: "maison", label: "Maison & déco", terms: { fr: "décoration maison", en: "home decor" }, keywords: ["maison", "home", "déco", "decor", "cuisine", "kitchen", "meuble", "furniture", "lampe", "lamp", "jardin", "garden", "ménage", "cleaning", "literie", "matelas", "mattress", "canapé"] },
  { id: "alimentation", label: "Alimentation", terms: { fr: "recette", en: "food" }, keywords: ["food", "recette", "recipe", "repas", "meal", "café", "coffee", "thé", "snack", "bio", "organic", "chocolat", "boisson", "drink", "vin", "wine"] },
  { id: "sante", label: "Santé & bien-être", terms: { fr: "bien-être", en: "wellness" }, keywords: ["santé", "health", "bien-être", "wellness", "sommeil", "sleep", "stress", "complément", "supplement", "vitamine", "vitamin", "méditation", "douleur", "posture"] },
  { id: "animaux", label: "Animaux", terms: { fr: "chien chat", en: "pet" }, keywords: ["chien", "dog", "chat", "cat", "animal", "pet", "croquette", "litière", "laisse", "leash"] },
  { id: "enfants", label: "Bébé & enfants", terms: { fr: "bébé", en: "baby" }, keywords: ["bébé", "baby", "enfant", "kid", "child", "jouet", "toy", "maman", "mom", "poussette", "couche"] },
  { id: "voyage", label: "Voyage", terms: { fr: "voyage", en: "travel" }, keywords: ["voyage", "travel", "vacances", "vacation", "hôtel", "hotel", "vol", "flight", "valise", "luggage", "séjour"] },
  { id: "finance", label: "Finance", terms: { fr: "investissement", en: "investing" }, keywords: ["finance", "banque", "bank", "crédit", "credit", "invest", "épargne", "saving", "assurance", "insurance", "crypto", "bourse", "budget"] },
  { id: "education", label: "Formation", terms: { fr: "formation en ligne", en: "online course" }, keywords: ["formation", "course", "cours", "apprendre", "learn", "masterclass", "coaching", "webinar", "certification", "école"] },
  { id: "auto", label: "Auto & moto", terms: { fr: "voiture", en: "car" }, keywords: ["voiture", "car ", "auto", "moto", "véhicule", "vehicle", "pneu", "tire", "électrique", "garage"] },
];

export const NICHE_MAP = new Map(NICHES.map((n) => [n.id, n]));

/** Best-effort niche classification from ad text (no AI cost). */
export function classifyNiche(text: string | null | undefined): string | null {
  if (!text) return null;
  const haystack = ` ${text.toLowerCase()} `;
  let best: { id: string; score: number } | null = null;
  for (const niche of NICHES) {
    let score = 0;
    for (const kw of niche.keywords) if (haystack.includes(kw)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { id: niche.id, score };
  }
  return best?.id ?? null;
}

/** EU/EEA countries: Meta exposes all commercial ads delivered there (DSA transparency). */
export const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO",
];

export const COUNTRIES: { code: string; label: string }[] = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" },
  { code: "IT", label: "Italie" },
  { code: "NL", label: "Pays-Bas" },
  { code: "PT", label: "Portugal" },
  { code: "IE", label: "Irlande" },
  { code: "AT", label: "Autriche" },
  { code: "LU", label: "Luxembourg" },
  { code: "PL", label: "Pologne" },
  { code: "SE", label: "Suède" },
  { code: "DK", label: "Danemark" },
  { code: "FI", label: "Finlande" },
  { code: "GR", label: "Grèce" },
  { code: "RO", label: "Roumanie" },
  { code: "CZ", label: "Tchéquie" },
  { code: "HU", label: "Hongrie" },
  { code: "NO", label: "Norvège" },
];

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "de", label: "Allemand" },
  { code: "es", label: "Espagnol" },
  { code: "it", label: "Italien" },
  { code: "nl", label: "Néerlandais" },
  { code: "pt", label: "Portugais" },
];

export const FORMATS = [
  { id: "image", label: "Image" },
  { id: "video", label: "Vidéo" },
  { id: "carousel", label: "Carrousel" },
] as const;

export const PLATFORMS = [
  { id: "meta", label: "Meta (Facebook, Instagram)" },
  { id: "tiktok", label: "TikTok" },
] as const;

export function nicheLabel(id: string | null | undefined) {
  return (id && NICHE_MAP.get(id)?.label) || "Non classée";
}

export function countryLabel(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}
