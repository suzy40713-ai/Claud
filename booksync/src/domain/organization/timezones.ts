/** Fuseaux proposés en priorité (France métropolitaine, DOM-TOM, pays francophones). */
export const PREFERRED_TIMEZONES = [
  { value: "Europe/Paris", label: "France métropolitaine (Paris)" },
  { value: "Europe/Brussels", label: "Belgique (Bruxelles)" },
  { value: "Europe/Zurich", label: "Suisse (Zurich)" },
  { value: "Europe/Luxembourg", label: "Luxembourg" },
  { value: "Europe/Monaco", label: "Monaco" },
  { value: "America/Montreal", label: "Québec (Montréal)" },
  { value: "America/Guadeloupe", label: "Guadeloupe" },
  { value: "America/Martinique", label: "Martinique" },
  { value: "America/Cayenne", label: "Guyane (Cayenne)" },
  { value: "Indian/Reunion", label: "La Réunion" },
  { value: "Indian/Mayotte", label: "Mayotte" },
  { value: "Pacific/Noumea", label: "Nouvelle-Calédonie (Nouméa)" },
  { value: "Pacific/Tahiti", label: "Polynésie française (Tahiti)" },
  { value: "Africa/Casablanca", label: "Maroc (Casablanca)" },
  { value: "Africa/Tunis", label: "Tunisie (Tunis)" },
  { value: "Africa/Algiers", label: "Algérie (Alger)" },
  { value: "Africa/Dakar", label: "Sénégal (Dakar)" },
  { value: "Africa/Abidjan", label: "Côte d'Ivoire (Abidjan)" },
] as const;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: tz });
    return tz.includes("/") || tz === "UTC";
  } catch {
    return false;
  }
}
