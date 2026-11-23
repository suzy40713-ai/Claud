export const site = {
  name: "BookSync",
  tagline: "De votre idée à vos premières ventes.",
  description:
    "BookSync est le copilote marketing des entrepreneurs, freelances et créateurs : analyse de votre produit, stratégie, publicités, contenus et suivi des ventes, avec un module de prise de rendez-vous en ligne.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: "contact@booksync.fr",
  locale: "fr-FR",
  defaultTimeZone: "Europe/Paris",
} as const;
