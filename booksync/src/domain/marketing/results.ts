/**
 * Statistiques marketing : uniquement à partir des chiffres déclarés par l'utilisateur.
 * Un indicateur n'est calculé que si les données nécessaires existent (sinon null, jamais 0 inventé).
 */
import { z } from "zod";
import { parsePriceInput } from "./product";
import { CHANNELS } from "./tools/options";

export const RESULT_CHANNELS = [
  ...CHANNELS,
  { value: "google", label: "Google Ads" },
  { value: "site", label: "Mon site / boutique" },
  { value: "autre", label: "Autre" },
] as const;

export function channelLabel(v: string) {
  return RESULT_CHANNELS.find((c) => c.value === v)?.label ?? "Autre";
}

const count = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      if (!/^\d{1,9}$/.test(v.replace(/\s/g, ""))) {
        ctx.addIssue({ code: "custom", message: `${label} : nombre entier attendu.` });
        return z.NEVER;
      }
      return Number(v.replace(/\s/g, ""));
    });

const money = (label: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const c = parsePriceInput(v);
      if (c === "invalid") {
        ctx.addIssue({ code: "custom", message: `${label} : montant invalide, par exemple 12,50.` });
        return z.NEVER;
      }
      return c;
    });

export const resultSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
    channel: z.enum(RESULT_CHANNELS.map((c) => c.value) as [string, ...string[]], {
      message: "Choisissez un canal.",
    }),
    productId: z.string().optional().transform((v) => v || null),
    spend: money("Dépense"),
    impressions: count("Vues"),
    clicks: count("Clics"),
    sales: count("Ventes"),
    revenue: money("Chiffre d'affaires"),
    note: z
      .string()
      .trim()
      .max(300, "300 caractères maximum.")
      .optional()
      .transform((v) => v || null),
  })
  .superRefine((v, ctx) => {
    if (
      v.spend === null &&
      v.impressions === null &&
      v.clicks === null &&
      v.sales === null &&
      v.revenue === null
    )
      ctx.addIssue({ code: "custom", path: ["spend"], message: "Renseignez au moins un chiffre." });
    if (v.clicks !== null && v.impressions !== null && v.clicks > v.impressions)
      ctx.addIssue({ code: "custom", path: ["clicks"], message: "Plus de clics que de vues ?" });
  });

export type ResultInput = z.input<typeof resultSchema>;

export type ResultRow = {
  channel: string;
  spendCents: number;
  impressions: number | null;
  clicks: number | null;
  sales: number | null;
  revenueCents: number | null;
};

type Totals = {
  spendCents: number;
  impressions: number | null;
  clicks: number | null;
  sales: number | null;
  revenueCents: number | null;
  entries: number;
};

function sumNullable(a: number | null, b: number | null) {
  return a === null ? b : b === null ? a : a + b;
}

export function totals(rows: ResultRow[]): Totals {
  return rows.reduce<Totals>(
    (t, r) => ({
      spendCents: t.spendCents + r.spendCents,
      impressions: sumNullable(t.impressions, r.impressions),
      clicks: sumNullable(t.clicks, r.clicks),
      sales: sumNullable(t.sales, r.sales),
      revenueCents: sumNullable(t.revenueCents, r.revenueCents),
      entries: t.entries + 1,
    }),
    { spendCents: 0, impressions: null, clicks: null, sales: null, revenueCents: null, entries: 0 },
  );
}

/** Indicateurs dérivés, seulement quand les données le permettent. */
export function ratios(t: Totals) {
  const pct = (a: number | null, b: number | null) =>
    a !== null && b !== null && b > 0 ? Math.round((a / b) * 1000) / 10 : null;
  return {
    clickRate: pct(t.clicks, t.impressions),
    conversionRate: pct(t.sales, t.clicks),
    costPerSaleCents:
      t.spendCents > 0 && t.sales !== null && t.sales > 0 ? Math.round(t.spendCents / t.sales) : null,
    /** Retour sur dépense publicitaire : chiffre d'affaires / dépense. */
    roas:
      t.spendCents > 0 && t.revenueCents !== null
        ? Math.round((t.revenueCents / t.spendCents) * 100) / 100
        : null,
  };
}

export function byChannel(rows: ResultRow[]) {
  const map = new Map<string, ResultRow[]>();
  for (const r of rows) map.set(r.channel, [...(map.get(r.channel) ?? []), r]);
  return [...map.entries()]
    .map(([channel, list]) => ({ channel, totals: totals(list) }))
    .sort((a, b) => b.totals.spendCents - a.totals.spendCents || b.totals.entries - a.totals.entries);
}
