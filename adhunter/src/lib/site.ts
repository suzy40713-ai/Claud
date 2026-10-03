export const siteConfig = {
  name: "AdHunter",
  tagline: "Trouve les publicités gagnantes. Crée des campagnes plus intelligentes.",
  description:
    "AdHunter t'aide à explorer les bibliothèques publicitaires officielles, analyser les publicités de ton marché avec l'IA et créer des campagnes plus efficaces.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@adhunter.app",
  // Legal identity — MUST be completed before going live (Mentions légales / CGV).
  legal: {
    companyName: process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME || "[Raison sociale à compléter]",
    legalForm: process.env.NEXT_PUBLIC_LEGAL_FORM || "[Forme juridique à compléter]",
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "[Adresse du siège à compléter]",
    registration: process.env.NEXT_PUBLIC_LEGAL_REGISTRATION || "[RCS / SIREN à compléter]",
    vat: process.env.NEXT_PUBLIC_LEGAL_VAT || "[N° TVA intracommunautaire à compléter]",
    director: process.env.NEXT_PUBLIC_LEGAL_DIRECTOR || "[Directeur de la publication à compléter]",
    host: process.env.NEXT_PUBLIC_LEGAL_HOST || "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    mediator: process.env.NEXT_PUBLIC_LEGAL_MEDIATOR || "[Médiateur de la consommation à compléter]",
  },
  lastLegalUpdate: "3 octobre 2026",
};
