/**
 * Modèles gratuits du copilote (sans IA, sans appel externe) : textes construits à partir des
 * informations saisies sur le produit. Rien n'est inventé : ce qui ne vient pas de la fiche est
 * formulé comme une idée ou une hypothèse à tester.
 */
import type { ProductCategory } from "../product";

export type ProductInfo = {
  name: string;
  description: string;
  priceCents: number | null;
  category: string;
  benefits: string | null;
  targetAudience: string | null;
  url: string | null;
};

export function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/** Première phrase de la description, sans point final. */
export function firstSentence(text: string, max = 180) {
  const s = clean(text).split(/(?<=[.!?])\s/)[0] ?? "";
  const cut = s.length > max ? `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : s;
  return cut.replace(/[.!?]+$/, "");
}

/** Avantages saisis (une ligne, une virgule ou un point-virgule par avantage). */
export function benefitList(p: ProductInfo) {
  return (p.benefits ?? "")
    .split(/\n|;|•|,(?=\s)/)
    .map((b) => clean(b).replace(/^[-–*\d.)\s]+/, "").replace(/[.!]+$/, ""))
    .filter((b) => b.length >= 3)
    .slice(0, 6);
}

export function lowerFirst(s: string) {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

export function priceText(p: ProductInfo) {
  if (p.priceCents === null) return null;
  const euros = p.priceCents / 100;
  return `${euros.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(euros) ? 0 : 2, maximumFractionDigits: 2 })} €`;
}

/** Choix déterministe dans une liste (la « version » fait varier les propositions). */
export function pick<T>(list: readonly T[], seed: number, offset = 0): T {
  return list[(((seed + offset) % list.length) + list.length) % list.length];
}

/** Rotation d'une liste selon la version demandée. */
export function rotate<T>(list: readonly T[], seed: number): T[] {
  const n = list.length;
  const k = ((seed % n) + n) % n;
  return [...list.slice(k), ...list.slice(0, k)];
}

export const CATEGORY_NOUN: Record<ProductCategory, string> = {
  physique: "produit",
  numerique: "produit numérique",
  service: "service",
  formation: "formation",
  abonnement: "abonnement",
  autre: "offre",
};

export function noun(p: ProductInfo) {
  return CATEGORY_NOUN[p.category as ProductCategory] ?? "offre";
}

/** Public visé : celui saisi, sinon un repère neutre à compléter. */
export function audienceOf(p: ProductInfo) {
  return p.targetAudience ? clean(p.targetAudience) : null;
}

/** Profils d'acheteurs possibles par catégorie : toujours des hypothèses. */
export const AUDIENCE_IDEAS: Record<ProductCategory, Array<{ name: string; description: string; motivation: string }>> = {
  physique: [
    { name: "Les acheteurs pour eux-mêmes", description: "Des personnes qui découvrent le produit en ligne et l'achètent pour leur usage.", motivation: "Se faire plaisir ou régler un petit problème du quotidien." },
    { name: "Les acheteurs de cadeaux", description: "Des personnes qui cherchent une idée de cadeau originale.", motivation: "Offrir quelque chose qui sort de l'ordinaire, sans se tromper." },
    { name: "Les fans du « fait par une petite marque »", description: "Des personnes qui préfèrent acheter à un indépendant.", motivation: "Soutenir un créateur et avoir un produit moins standard." },
  ],
  numerique: [
    { name: "Les débutants pressés", description: "Des personnes qui veulent un résultat sans tout apprendre seules.", motivation: "Gagner du temps avec une méthode toute prête." },
    { name: "Les autodidactes", description: "Des personnes qui ont déjà cherché gratuitement sans trouver une méthode claire.", motivation: "Avoir enfin tout au même endroit, dans le bon ordre." },
  ],
  service: [
    { name: "Les clients qui manquent de temps", description: "Des personnes qui pourraient le faire elles-mêmes mais n'ont pas le temps.", motivation: "Déléguer et être tranquilles." },
    { name: "Les clients qui ne savent pas faire", description: "Des personnes bloquées par le côté technique.", motivation: "Être accompagnées par quelqu'un de patient." },
  ],
  formation: [
    { name: "Les débutants motivés", description: "Des personnes qui veulent apprendre mais ne savent pas par où commencer.", motivation: "Être guidées pas à pas." },
    { name: "Les personnes en reconversion", description: "Des personnes qui veulent une nouvelle compétence pour changer de situation.", motivation: "Progresser vite et concrètement." },
  ],
  abonnement: [
    { name: "Les habitués", description: "Des personnes qui consomment déjà ce type de produit régulièrement.", motivation: "Ne plus avoir à y penser chaque mois." },
    { name: "Les curieux", description: "Des personnes qui aiment découvrir des nouveautés.", motivation: "Recevoir une surprise régulière." },
  ],
  autre: [
    { name: "Les premiers curieux", description: "Votre entourage et les personnes qui suivent déjà vos contenus.", motivation: "Vous faire confiance et essayer." },
    { name: "Les personnes qui ont le problème que vous résolvez", description: "À décrire précisément après vos premiers échanges.", motivation: "Trouver une solution simple." },
  ],
};

export function audienceIdeas(p: ProductInfo) {
  return AUDIENCE_IDEAS[p.category as ProductCategory] ?? AUDIENCE_IDEAS.autre;
}

/** Canaux gratuits conseillés par catégorie. */
export const CHANNEL_IDEAS: Record<ProductCategory, Array<{ channel: string; why: string }>> = {
  physique: [
    { channel: "TikTok", why: "Montrer le produit en vrai (fabrication, déballage, utilisation) en vidéos courtes, sans budget." },
    { channel: "Instagram", why: "Photos soignées et Reels : utile pour donner confiance avant l'achat." },
    { channel: "Pinterest", why: "Les gens y cherchent des idées d'achat et de cadeaux ; une épingle peut être vue pendant des mois." },
  ],
  numerique: [
    { channel: "TikTok", why: "Donner un conseil gratuit tiré du produit, puis renvoyer vers la version complète." },
    { channel: "YouTube Shorts", why: "Les tutoriels courts y circulent bien et longtemps." },
    { channel: "Email / newsletter", why: "Envoyer un extrait gratuit en échange d'un email, puis présenter le produit." },
  ],
  service: [
    { channel: "Bouche-à-oreille et proches", why: "Vos premiers clients viennent souvent de votre entourage et de leurs recommandations." },
    { channel: "Instagram", why: "Montrer des avant/après et votre façon de travailler." },
    { channel: "Facebook", why: "Les groupes locaux ou thématiques permettent de répondre à des demandes réelles." },
  ],
  formation: [
    { channel: "TikTok", why: "Une astuce par vidéo prouve que vous savez expliquer." },
    { channel: "LinkedIn", why: "Utile si votre formation sert le travail ou la reconversion." },
    { channel: "Email / newsletter", why: "Un mini-cours gratuit par email convertit les curieux en élèves." },
  ],
  abonnement: [
    { channel: "Instagram", why: "Montrer chaque mois ce que reçoivent les abonnés." },
    { channel: "TikTok", why: "Les vidéos de déballage donnent envie de s'abonner." },
    { channel: "Email / newsletter", why: "Garder le lien avec les abonnés et réduire les résiliations." },
  ],
  autre: [
    { channel: "TikTok", why: "Gratuit et adapté pour se faire connaître vite." },
    { channel: "Instagram", why: "Une vitrine pour donner confiance." },
    { channel: "Bouche-à-oreille et proches", why: "Les premiers clients viennent souvent de votre entourage." },
  ],
};

export function channelIdeas(p: ProductInfo) {
  return CHANNEL_IDEAS[p.category as ProductCategory] ?? CHANNEL_IDEAS.autre;
}
