/** Version des conditions générales. À incrémenter à chaque modification substantielle. */
export const TERMS_VERSION = "2026-11-05";

/**
 * Informations de l'éditeur (mentions légales, CGU).
 * ⚠️ À COMPLÉTER avant la mise en ligne avec les informations réelles de votre société.
 */
export const PUBLISHER = {
  companyName: process.env.NEXT_PUBLIC_LEGAL_COMPANY ?? "[Raison sociale à compléter]",
  legalForm: process.env.NEXT_PUBLIC_LEGAL_FORM ?? "[Forme juridique et capital à compléter]",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "[Adresse du siège à compléter]",
  registration: process.env.NEXT_PUBLIC_LEGAL_SIREN ?? "[RCS / SIREN à compléter]",
  vat: process.env.NEXT_PUBLIC_LEGAL_VAT ?? "[N° de TVA intracommunautaire à compléter]",
  director: process.env.NEXT_PUBLIC_LEGAL_DIRECTOR ?? "[Directeur de la publication à compléter]",
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? "contact@booksync.fr",
};

export const SUBPROCESSORS = [
  { name: "Render Services, Inc.", role: "Hébergement de l'application", location: "Union européenne (Francfort)" },
  { name: "Supabase, Inc.", role: "Base de données", location: "Union européenne" },
  { name: "Resend (Plus Five Five, Inc.)", role: "Envoi des emails transactionnels", location: "États-Unis (clauses contractuelles types)" },
  { name: "Stripe Payments Europe, Ltd.", role: "Paiement des abonnements BookSync", location: "Irlande" },
  { name: "Google Ireland Ltd.", role: "Connexion avec Google (facultative)", location: "Irlande" },
];
