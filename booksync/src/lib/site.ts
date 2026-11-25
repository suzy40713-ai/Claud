export const site = {
  name: "BookSync",
  tagline: "De votre idée à vos premières ventes.",
  description:
    "BookSync transforme votre produit en stratégie marketing complète grâce à l'intelligence artificielle : analyse, clients cibles, concurrence, stratégie, publicités, contenus et plan d'action.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: "contact@booksync.fr",
  locale: "fr-FR",
  defaultTimeZone: "Europe/Paris",
} as const;
