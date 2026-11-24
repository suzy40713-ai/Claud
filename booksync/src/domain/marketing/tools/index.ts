/** Registre des outils du copilote : un outil = des choix et un format de résultat. */
import type { z } from "zod";
import { AD_OPTIONS, adSchema } from "./ad";
import { CONTENT_OPTIONS, contentSchema } from "./content";
import type { ToolOption } from "./options";
import { SALES_OPTIONS, salesSchema } from "./sales";
import { checkStrategy, STRATEGY_OPTIONS, strategySchema } from "./strategy";

export type ToolKind = "strategy" | "ad" | "content" | "sales";

type Def<S extends z.ZodType> = {
  kind: ToolKind;
  title: string;
  section: string;
  options: readonly ToolOption[];
  schema: S;
  check?: (o: z.infer<S>) => string | null;
};

function def<S extends z.ZodType>(d: Def<S>) {
  return d;
}

export const TOOLS = {
  strategy: def({
    kind: "strategy",
    title: "Stratégie 30 jours",
    section: "/tableau-de-bord/strategies",
    options: STRATEGY_OPTIONS,
    schema: strategySchema,
    check: checkStrategy,
  }),
  ad: def({
    kind: "ad",
    title: "Publicité",
    section: "/tableau-de-bord/publicites",
    options: AD_OPTIONS,
    schema: adSchema,
  }),
  content: def({
    kind: "content",
    title: "Contenus",
    section: "/tableau-de-bord/contenus",
    options: CONTENT_OPTIONS,
    schema: contentSchema,
  }),
  sales: def({
    kind: "sales",
    title: "Sales Booster",
    section: "/tableau-de-bord/sales-booster",
    options: SALES_OPTIONS,
    schema: salesSchema,
  }),
} as const;

export function isToolKind(k: string): k is ToolKind {
  return k in TOOLS;
}
