/**
 * Adresse publique d'une entreprise : booksync.fr/{slug}.
 * Logique pure, partagée entre le formulaire (suggestion en direct) et le serveur (validation).
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 48;

/** Segments d'URL réservés à l'application : ne peuvent pas devenir une adresse publique. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "aide",
  "auth",
  "blog",
  "booksync",
  "compte",
  "connexion",
  "contact",
  "cgu",
  "cgv",
  "confidentialite",
  "dashboard",
  "dev",
  "docs",
  "inscription",
  "invitation",
  "legal",
  "login",
  "logout",
  "mentions-legales",
  "mot-de-passe-oublie",
  "onboarding",
  "parametres",
  "prix",
  "reinitialiser-mot-de-passe",
  "reservation",
  "rdv",
  "signup",
  "statut",
  "support",
  "tableau-de-bord",
  "tarifs",
  "verifier-email",
  "www",
  "_next",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[œ]/gi, "oe")
    .replace(/[æ]/gi, "ae")
    .replace(/&/g, " et ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export type SlugError = "too_short" | "too_long" | "invalid" | "reserved";

export function validateSlug(slug: string): SlugError | null {
  if (slug.length < SLUG_MIN) return "too_short";
  if (slug.length > SLUG_MAX) return "too_long";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "invalid";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return null;
}

export const SLUG_ERROR_MESSAGES: Record<SlugError | "taken", string> = {
  too_short: `L'adresse doit contenir au moins ${SLUG_MIN} caractères.`,
  too_long: `L'adresse ne peut pas dépasser ${SLUG_MAX} caractères.`,
  invalid: "Utilisez uniquement des lettres minuscules, des chiffres et des tirets.",
  reserved: "Cette adresse est réservée. Choisissez-en une autre.",
  taken: "Cette adresse est déjà utilisée par une autre entreprise.",
};
