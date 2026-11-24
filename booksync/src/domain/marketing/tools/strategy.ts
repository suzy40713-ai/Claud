import { z } from "zod";
import { BASIS } from "../analysis";
import { CHANNELS, type ToolOption } from "./options";

export const STRATEGY_OPTIONS: readonly ToolOption[] = [
  {
    type: "select",
    name: "objective",
    label: "Objectif principal",
    default: "ventes",
    choices: [
      { value: "ventes", label: "Faire mes premières ventes" },
      { value: "notoriete", label: "Me faire connaître" },
      { value: "audience", label: "Construire une communauté" },
      { value: "relance", label: "Relancer des ventes qui stagnent" },
    ],
  },
  {
    type: "select",
    name: "time",
    label: "Temps disponible par semaine",
    default: "3-5h",
    choices: [
      { value: "1-2h", label: "1 à 2 heures" },
      { value: "3-5h", label: "3 à 5 heures" },
      { value: "5h+", label: "Plus de 5 heures" },
    ],
  },
  {
    type: "select",
    name: "budget",
    label: "Budget publicitaire mensuel",
    default: "0",
    choices: [
      { value: "0", label: "Aucun (100 % gratuit)" },
      { value: "50", label: "Moins de 50 €" },
      { value: "200", label: "50 à 200 €" },
      { value: "200+", label: "Plus de 200 €" },
    ],
  },
  {
    type: "multi",
    name: "channels",
    label: "Canaux que vous voulez utiliser",
    hint: "Jusqu'à 3. Mieux vaut peu de canaux bien tenus.",
    default: ["tiktok", "instagram"],
    max: 3,
    choices: CHANNELS,
  },
];

const action = z.object({
  title: z.string().describe("Action concrète, commence par un verbe."),
  detail: z.string().describe("Comment la faire, en une ou deux phrases."),
  channel: z.string().describe("Canal concerné ou « Préparation »."),
});

export const strategySchema = z.object({
  summary: z.string().describe("La stratégie en 2 ou 3 phrases."),
  positioning: z.string(),
  pillars: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .describe("3 thèmes de contenu récurrents."),
  channels: z
    .array(z.object({ channel: z.string(), role: z.string(), frequency: z.string() }))
    .describe("Uniquement les canaux choisis par l'utilisateur."),
  weeks: z
    .array(z.object({ week: z.number().int(), focus: z.string() }))
    .describe("Les 4 semaines (week 1 à 4) et leur priorité."),
  days: z
    .array(z.object({ day: z.number().int(), theme: z.string(), actions: z.array(action) }))
    .describe("Exactement 30 jours (day 1 à 30), 3 actions par jour."),
  measure: z
    .array(z.object({ metric: z.string(), how: z.string() }))
    .describe("3 à 5 indicateurs à suivre soi-même, sans objectif chiffré promis."),
  assumptions: z
    .array(z.object({ text: z.string(), basis: z.enum(BASIS) }))
    .describe("Les hypothèses sur lesquelles repose la stratégie."),
});

export type Strategy = z.infer<typeof strategySchema>;

/** 30 jours distincts de 1 à 30, chacun avec au moins une action. */
export function checkStrategy(s: Strategy): string | null {
  const days = new Set(s.days.filter((d) => d.actions.length > 0).map((d) => d.day));
  for (let d = 1; d <= 30; d++) if (!days.has(d)) return `jour ${d} manquant`;
  return null;
}

