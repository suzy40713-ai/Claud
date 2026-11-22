/**
 * « Lance ton activité » : plan de lancement généré à partir de modèles (aucune IA, aucun coût).
 * Logique pure, testée unitairement. Les prix sont des points de départ à adapter, jamais des
 * moyennes de marché.
 */
import { ACTIVITIES, type ActivityId } from "@/domain/activities";

/** Métiers proposés dans l'outil (ceux qu'on lance seul, souvent depuis chez soi). */
export const LAUNCH_ACTIVITIES = [
  "onglerie",
  "tresses",
  "coiffure",
  "barbier",
  "cils",
  "maquillage",
  "esthetique",
  "massage",
  "coach",
  "cours",
  "consultation",
  "freelance",
] as const satisfies ReadonlyArray<ActivityId>;

/** Métiers qui se pratiquent surtout en ligne (visio). */
export const ONLINE_ACTIVITIES: ReadonlySet<LaunchActivity> = new Set([
  "coach",
  "cours",
  "consultation",
  "freelance",
]);
export type LaunchActivity = (typeof LAUNCH_ACTIVITIES)[number];

export type LaunchPlace = "en-ligne" | "domicile" | "chez-moi" | "salon";
export type LaunchLevel = "debutant" | "confirme";

export type LaunchInput = {
  activity: LaunchActivity;
  firstName: string;
  city: string;
  place: LaunchPlace;
  level: LaunchLevel;
};

export const PLACE_LABELS: Record<LaunchPlace, string> = {
  "en-ligne": "En ligne, en visio",
  domicile: "Je me déplace à domicile",
  "chez-moi": "Je reçois chez moi",
  salon: "Dans un salon ou un local",
};

/** Mot-clé du métier pour les noms, emoji pour la bio, mots que les clientes cherchent. */
const STYLE: Record<
  LaunchActivity,
  { word: string; short: string; emoji: string; search: string; job: string }
> = {
  onglerie: {
    word: "Nails",
    short: "Ongles",
    emoji: "💅",
    search: "ongles",
    job: "Prothésiste ongulaire",
  },
  tresses: { word: "Braids", short: "Tresses", emoji: "✨", search: "tresses", job: "Tresseuse" },
  coiffure: { word: "Hair", short: "Coiffure", emoji: "✂️", search: "coiffure", job: "Coiffeuse" },
  barbier: { word: "Barber", short: "Barber", emoji: "💈", search: "barbier", job: "Barbier" },
  cils: {
    word: "Lashes",
    short: "Cils",
    emoji: "👁️",
    search: "extension de cils",
    job: "Technicienne cils",
  },
  maquillage: {
    word: "Makeup",
    short: "Makeup",
    emoji: "💄",
    search: "maquillage",
    job: "Maquilleuse",
  },
  esthetique: {
    word: "Beauty",
    short: "Beauté",
    emoji: "🌸",
    search: "esthéticienne",
    job: "Esthéticienne",
  },
  massage: {
    word: "Zen",
    short: "Massage",
    emoji: "🌿",
    search: "massage",
    job: "Praticienne massage",
  },
  coach: { word: "Coaching", short: "Coaching", emoji: "🚀", search: "coaching", job: "Coach" },
  cours: {
    word: "Academy",
    short: "Cours",
    emoji: "📚",
    search: "cours en ligne",
    job: "Professeur",
  },
  consultation: {
    word: "Conseil",
    short: "Conseil",
    emoji: "💡",
    search: "consultation",
    job: "Consultante",
  },
  freelance: { word: "Studio", short: "Créa", emoji: "💻", search: "freelance", job: "Freelance" },
};

/** Remise appliquée aux prix d'exemple quand on débute (pour remplir l'agenda vite). */
export const BEGINNER_DISCOUNT = 0.85;

const clean = (s: string) => s.trim().replace(/\s+/g, " ").slice(0, 40);

const capitalize = (s: string) => (s ? s[0].toLocaleUpperCase("fr-FR") + s.slice(1) : s);

/** Arrondi au multiple de 5 € le plus proche (minimum 5 €), prix gratuits conservés. */
export function roundPrice(cents: number) {
  if (cents <= 0) return 0;
  return Math.max(500, Math.round(cents / 500) * 500);
}

export function nameIdeas(input: Pick<LaunchInput, "activity" | "firstName" | "city" | "place">) {
  const s = STYLE[input.activity];
  const name = capitalize(clean(input.firstName)) || "Studio";
  const city = capitalize(clean(input.city));
  const ideas = [
    `${name} ${s.word}`,
    `L'Atelier de ${name}`,
    `${s.short} by ${name}`,
    `Studio ${name}`,
    city ? `${city} ${s.word}` : `${name} ${s.short}`,
    input.place === "domicile"
      ? `${name} ${s.word} à domicile`
      : input.place === "en-ligne"
        ? `${name} ${s.word} Online`
        : `Maison ${name}`,
  ];
  return [...new Set(ideas)];
}

export function suggestedServices(activity: LaunchActivity, level: LaunchLevel) {
  const def = ACTIVITIES.find((a) => a.value === activity)!;
  return def.examples.map(([name, durationMinutes, priceCents]) => ({
    name,
    durationMinutes,
    priceCents: roundPrice(level === "debutant" ? priceCents * BEGINNER_DISCOUNT : priceCents),
  }));
}

export function instagramBio(input: LaunchInput) {
  const s = STYLE[input.activity];
  const city = capitalize(clean(input.city));
  const where =
    input.place === "en-ligne"
      ? "en visio · partout en France"
      : input.place === "domicile"
        ? `à domicile${city ? ` · ${city} et alentours` : ""}`
        : city
          ? `à ${city}`
          : "";
  return [
    `${s.emoji} ${s.job} ${where}`.trim(),
    "📅 Réservation en ligne 24h/24",
    "👇 Prends ton rendez-vous ici",
  ].join("\n");
}

export type LaunchStep = { day: string; title: string; detail: string; link?: string };

export function launchChecklist(input: LaunchInput): LaunchStep[] {
  const s = STYLE[input.activity];
  const city = capitalize(clean(input.city));
  const regulated = ["coiffure", "esthetique", "tresses", "barbier"].includes(input.activity);
  const online = input.place === "en-ligne";
  const steps: LaunchStep[] = [
    {
      day: "Jour 1",
      title: "Déclare ta micro-entreprise",
      detail:
        "C'est gratuit et en ligne, sur le guichet unique officiel. Tu reçois ton numéro SIRET en quelques jours.",
      link: "https://formalites.entreprises.gouv.fr",
    },
    {
      day: "Jour 1",
      title: regulated
        ? "Vérifie le diplôme demandé pour ton métier"
        : "Vérifie les règles de ton métier",
      detail: regulated
        ? "La coiffure et l'esthétique sont des métiers réglementés : renseigne-toi sur la qualification exigée avant de démarrer."
        : "Renseigne-toi sur les règles d'hygiène et les éventuelles formations recommandées.",
      link: "https://entreprendre.service-public.fr",
    },
    {
      day: "Jour 2",
      title: "Prends une assurance responsabilité civile pro",
      detail: "Elle te couvre si un accident arrive pendant une prestation. Compare 2 ou 3 devis.",
    },
    {
      day: "Jour 2",
      title: "Crée ta page de réservation",
      detail:
        "Ton nom, tes prestations et tes prix : tes clientes réservent seules, même la nuit, sans t'appeler.",
    },
    ...(online
      ? [
          {
            day: "Jour 2",
            title: "Active la visio et le paiement à l'avance",
            detail:
              "Colle ton lien Google Meet ou Zoom : il part tout seul dans chaque confirmation. Fais payer la séance à la réservation : plus de rendez-vous oubliés. Inclus dans le forfait Starter, 1er mois offert.",
          },
        ]
      : []),
    {
      day: "Jour 3",
      title: "Prépare ton Instagram et ton TikTok",
      detail:
        "Colle ta bio, mets le lien de ta page, publie 6 photos de tes plus belles réalisations.",
    },
    {
      day: "Jour 4",
      title: "Trouve tes 5 premières clientes",
      detail: online
        ? "Offre un appel découverte gratuit de 20 minutes à 10 personnes de ton réseau, puis demande-leur un avis."
        : `Propose un prix de lancement à ton entourage en échange d'un avis et d'une photo.${city ? ` Poste dans les groupes Facebook de ${city}.` : ""}`,
    },
    {
      day: "Jours 5 à 7",
      title: "Publie une vidéo par jour",
      detail: online
        ? `Un conseil utile par vidéo, un résultat client, une question fréquente sur le ${s.search}. Termine par « réserve ton appel via le lien en bio ».`
        : `Avant/après, ta journée, un conseil ${s.search} : montre ton travail, pas ton visage si tu préfères. Termine par « réserve via le lien en bio ».`,
    },
  ];
  return steps;
}

export function firstVideoIdeas(input: LaunchInput) {
  const s = STYLE[input.activity];
  const city = capitalize(clean(input.city));
  if (input.place === "en-ligne")
    return [
      `« 3 erreurs que je vois chez tous ceux qui commencent en ${s.search} »`,
      `« Ce que je fais pendant un appel découverte de 20 minutes »`,
      `« Tu peux réserver ta séance à 23 h, même un dimanche »`,
    ];
  return [
    `Avant / après : ${s.search} en accéléré`,
    `« Ce que personne ne te dit avant de te lancer en ${s.search} »`,
    city
      ? `« ${s.job} à ${city} : il me reste 3 créneaux cette semaine »`
      : `« Il me reste 3 créneaux cette semaine »`,
  ];
}

export function buildLaunchPlan(input: LaunchInput) {
  return {
    names: nameIdeas(input),
    services: suggestedServices(input.activity, input.level),
    bio: instagramBio(input),
    checklist: launchChecklist(input),
    videos: firstVideoIdeas(input),
  };
}

export function isLaunchActivity(v: string): v is LaunchActivity {
  return (LAUNCH_ACTIVITIES as readonly string[]).includes(v);
}
