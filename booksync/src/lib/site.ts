export const site = {
  name: "BookSync",
  tagline: "De zéro à ta première vente.",
  description:
    "BookSync aide les débutants à gagner leurs premiers euros : trouver quoi vendre, apprendre le business et savoir chaque jour quoi faire pour vendre.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: "contact@booksync.fr",
  locale: "fr-FR",
  defaultTimeZone: "Europe/Paris",
} as const;
