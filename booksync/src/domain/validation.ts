import { z } from "zod";

/** Téléphone français (0X XX XX XX XX) ou international (+XX…). Renvoie la forme normalisée. */
export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[\s.\-()]/g, "");
  if (/^0[1-9]\d{8}$/.test(compact)) return compact.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  if (/^00[1-9]\d{7,13}$/.test(compact)) return `+${compact.slice(2)}`;
  return null;
}

export const optionalText = (max: number, label = "Ce champ") =>
  z
    .string()
    .trim()
    .max(max, `${label} ne peut pas dépasser ${max} caractères.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const optionalPhone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Numéro de téléphone invalide (ex. 06 12 34 56 78 ou +33 6 12 34 56 78)." });
      return z.NEVER;
    }
    return n;
  })
  .nullable()
  .optional();

export const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!z.email().safeParse(v).success) {
      ctx.addIssue({ code: "custom", message: "Adresse email invalide." });
      return z.NEVER;
    }
    return v;
  })
  .nullable()
  .optional();

export const postalCode = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!/^[A-Za-z0-9 -]{3,10}$/.test(v)) {
      ctx.addIssue({ code: "custom", message: "Code postal invalide." });
      return z.NEVER;
    }
    return v.toUpperCase();
  })
  .nullable()
  .optional();

export const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (format #RRGGBB).");
