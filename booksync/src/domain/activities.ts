/** Secteurs d'activité proposés à l'installation (servent à pré-remplir des services d'exemple). */
export const ACTIVITIES = [
  {
    value: "coiffure",
    label: "Coiffeur / Coiffeuse",
    examples: [
      ["Coupe femme", 45, 4500],
      ["Coupe homme", 30, 2500],
      ["Brushing", 30, 2800],
    ],
  },
  {
    value: "barbier",
    label: "Barbier",
    examples: [
      ["Coupe", 30, 2500],
      ["Taille de barbe", 20, 1500],
      ["Coupe + barbe", 45, 3500],
    ],
  },
  {
    value: "esthetique",
    label: "Esthéticienne",
    examples: [
      ["Soin du visage", 60, 6000],
      ["Épilation jambes", 45, 3500],
      ["Manucure", 45, 3000],
    ],
  },
  {
    value: "coaching",
    label: "Coach sportif",
    examples: [
      ["Séance individuelle", 60, 5000],
      ["Bilan forme", 45, 4000],
    ],
  },
  {
    value: "photographie",
    label: "Photographe",
    examples: [
      ["Séance portrait", 60, 12000],
      ["Shooting famille", 90, 18000],
    ],
  },
  {
    value: "cours",
    label: "Professeur particulier",
    examples: [
      ["Cours d'une heure", 60, 3500],
      ["Cours d'1 h 30", 90, 5000],
    ],
  },
  {
    value: "massage",
    label: "Massage bien-être",
    examples: [
      ["Massage relaxant 1 h", 60, 6000],
      ["Massage 30 min", 30, 3500],
    ],
  },
  {
    value: "onglerie",
    label: "Prothésiste ongulaire",
    examples: [
      ["Pose semi-permanent", 45, 3500],
      ["Remplissage gel", 60, 4500],
    ],
  },
  {
    value: "tatouage",
    label: "Tatoueur",
    examples: [
      ["Consultation projet", 30, 0],
      ["Séance (heure)", 60, 10000],
    ],
  },
  {
    value: "kinesitherapie",
    label: "Kinésithérapeute",
    examples: [
      ["Séance", 30, 1650],
      ["Bilan initial", 45, 2500],
    ],
  },
  {
    value: "garage",
    label: "Garage",
    examples: [
      ["Vidange", 60, 8900],
      ["Contrôle avant vacances", 30, 0],
      ["Changement de pneus", 60, 4000],
    ],
  },
  { value: "autre", label: "Autre activité", examples: [["Rendez-vous", 30, 0]] },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  examples: ReadonlyArray<readonly [string, number, number]>;
}>;

export type ActivityId = (typeof ACTIVITIES)[number]["value"];

export function activityLabel(value: string | null | undefined) {
  return ACTIVITIES.find((a) => a.value === value)?.label ?? null;
}

/**
 * Activités de santé : un rendez-vous y révèle une donnée de santé, dont l'hébergement exige en France
 * une certification HDS. Elles restent utilisables pour l'agenda du professionnel mais ne sont JAMAIS
 * proposées dans l'annuaire public.
 */
export const HEALTH_ACTIVITIES: ReadonlySet<string> = new Set(["kinesitherapie"]);

export function isDirectoryActivity(value: string | null | undefined) {
  return Boolean(value) && !HEALTH_ACTIVITIES.has(value!);
}

/** Métiers proposés dans la recherche de l'annuaire (hors santé et hors « Autre »). */
export const DIRECTORY_ACTIVITIES = ACTIVITIES.filter(
  (a) => isDirectoryActivity(a.value) && a.value !== "autre",
);
