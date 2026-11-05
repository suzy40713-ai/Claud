/** Secteurs d'activité proposés à l'installation (servent à pré-remplir des services d'exemple). */
export const ACTIVITIES = [
  { value: "coiffure", label: "Coiffeur / Coiffeuse", examples: [["Coupe femme", 45, 4500], ["Coupe homme", 30, 2500], ["Brushing", 30, 2800]] },
  { value: "barbier", label: "Barbier", examples: [["Coupe", 30, 2500], ["Taille de barbe", 20, 1500], ["Coupe + barbe", 45, 3500]] },
  { value: "esthetique", label: "Esthéticienne", examples: [["Soin du visage", 60, 6000], ["Épilation jambes", 45, 3500], ["Manucure", 45, 3000]] },
  { value: "coaching", label: "Coach sportif", examples: [["Séance individuelle", 60, 5000], ["Bilan forme", 45, 4000]] },
  { value: "photographie", label: "Photographe", examples: [["Séance portrait", 60, 12000], ["Shooting famille", 90, 18000]] },
  { value: "cours", label: "Professeur particulier", examples: [["Cours d'une heure", 60, 3500], ["Cours d'1 h 30", 90, 5000]] },
  { value: "kinesitherapie", label: "Kinésithérapeute", examples: [["Séance", 30, 1650], ["Bilan initial", 45, 2500]] },
  { value: "garage", label: "Garage", examples: [["Vidange", 60, 8900], ["Contrôle avant vacances", 30, 0], ["Changement de pneus", 60, 4000]] },
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
