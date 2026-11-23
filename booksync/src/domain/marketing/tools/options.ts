/**
 * Choix proposés à l'utilisateur avant une génération (formulaire + validation serveur).
 * Seules les valeurs listées sont acceptées ; le modèle reçoit les libellés.
 */
import { z } from "zod";

export type Choice = { value: string; label: string };

export type ToolOption =
  | {
      type: "select";
      name: string;
      label: string;
      choices: readonly Choice[];
      default: string;
    }
  | {
      type: "multi";
      name: string;
      label: string;
      hint?: string;
      choices: readonly Choice[];
      default: readonly string[];
      max: number;
    }
  | {
      type: "text";
      name: string;
      label: string;
      hint?: string;
      placeholder?: string;
      maxLength: number;
      optional: true;
    };

export type ToolOptionValues = Record<string, string | string[]>;

/** Valide les choix envoyés par le navigateur et les traduit en libellés pour le modèle. */
export function parseToolOptions(defs: readonly ToolOption[], raw: unknown) {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const values: ToolOptionValues = {};
  const labelled: Record<string, string | string[]> = {};
  for (const d of defs) {
    const v = input[d.name];
    if (d.type === "select") {
      const c = d.choices.find((x) => x.value === v);
      if (!c) throw new z.ZodError([{ code: "custom", path: [d.name], message: "Choix invalide.", input: v }]);
      values[d.name] = c.value;
      labelled[d.label] = c.label;
    } else if (d.type === "multi") {
      const arr = Array.isArray(v) ? v : [];
      const picked = d.choices.filter((c) => arr.includes(c.value));
      if (picked.length === 0 || picked.length > d.max || arr.length !== picked.length)
        throw new z.ZodError([
          { code: "custom", path: [d.name], message: `Choisissez entre 1 et ${d.max} options.`, input: v },
        ]);
      values[d.name] = picked.map((c) => c.value);
      labelled[d.label] = picked.map((c) => c.label);
    } else {
      const text = typeof v === "string" ? v.trim() : "";
      if (text.length > d.maxLength)
        throw new z.ZodError([
          { code: "custom", path: [d.name], message: `${d.maxLength} caractères maximum.`, input: v },
        ]);
      values[d.name] = text;
      labelled[d.label] = text || "non fourni";
    }
  }
  return { values, labelled };
}

export function defaultOptionValues(defs: readonly ToolOption[]): ToolOptionValues {
  return Object.fromEntries(
    defs.map((d) => [d.name, d.type === "text" ? "" : d.type === "multi" ? [...d.default] : d.default]),
  );
}

export const CHANNELS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube Shorts" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "pinterest", label: "Pinterest" },
  { value: "email", label: "Email / newsletter" },
  { value: "proches", label: "Bouche-à-oreille et proches" },
] as const;
