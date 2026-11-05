export const site = {
  name: "BookSync",
  tagline: "Vos rendez-vous, parfaitement organisés.",
  description:
    "BookSync est le logiciel de prise de rendez-vous en ligne pour les professionnels : agenda partagé, page de réservation, rappels automatiques et statistiques.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: "contact@booksync.fr",
  locale: "fr-FR",
  defaultTimeZone: "Europe/Paris",
} as const;
