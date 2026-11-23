/**
 * Produits du copilote marketing : validation des données saisies (logique pure, testée).
 */
import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  { value: "physique", label: "Produit physique" },
  { value: "numerique", label: "Produit numérique" },
  { value: "service", label: "Service" },
  { value: "formation", label: "Formation / coaching" },
  { value: "abonnement", label: "Abonnement" },
  { value: "autre", label: "Autre" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];

export function categoryLabel(value: string) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? "Autre";
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .optional()
    .transform((v) => (v ? v : null));

/** Prix saisi en euros (« 24,90 », « 24 € », vide) → centimes ou null. */
export function parsePriceInput(input: string | null | undefined): number | null | "invalid" {
  const v = (input ?? "").replace(/\s|€/g, "").replace(",", ".");
  if (!v) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(v)) return "invalid";
  return Math.round(Number(v) * 100);
}

/** Adresse du produit : https uniquement (ou ajoutée), longueur bornée. */
export function normalizeProductUrl(input: string | null | undefined): string | null | "invalid" {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (withScheme.length > 500) return "invalid";
  try {
    const url = new URL(withScheme);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".") || url.username)
      return "invalid";
    return url.toString();
  } catch {
    return "invalid";
  }
}

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Indiquez le nom du produit.")
      .max(120, "120 caractères maximum."),
    description: z
      .string()
      .trim()
      .min(20, "Décrivez votre produit en quelques phrases (20 caractères minimum).")
      .max(3000, "3 000 caractères maximum."),
    price: z.string().optional(),
    category: z.enum(
      PRODUCT_CATEGORIES.map((c) => c.value) as [ProductCategory, ...ProductCategory[]],
      {
        message: "Choisissez une catégorie.",
      },
    ),
    benefits: optionalText(1500, "Avantages"),
    targetAudience: optionalText(800, "Public cible"),
    url: z.string().optional(),
  })
  .transform((v, ctx) => {
    const priceCents = parsePriceInput(v.price);
    if (priceCents === "invalid") {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Prix invalide, par exemple 24,90.",
      });
      return z.NEVER;
    }
    const url = normalizeProductUrl(v.url);
    if (url === "invalid") {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Lien invalide, par exemple https://maboutique.fr/produit.",
      });
      return z.NEVER;
    }
    return {
      name: v.name,
      description: v.description,
      priceCents,
      category: v.category,
      benefits: v.benefits,
      targetAudience: v.targetAudience,
      url,
    };
  });

export type ProductInput = z.input<typeof productSchema>;
