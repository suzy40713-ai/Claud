/** Registre des outils du copilote : un outil = des choix et un format de résultat. */
import type { z } from "zod";
import { AD_OPTIONS, adSchema } from "./ad";
import { COMPETITORS_OPTIONS, competitorsSchema } from "./competitors";
import { CONTENT_OPTIONS, contentSchema } from "./content";
import { CUSTOMERS_OPTIONS, customersSchema } from "./customers";
import type { ToolOption } from "./options";
import { SALES_OPTIONS, salesSchema } from "./sales";
import { checkStrategy, STRATEGY_OPTIONS, strategySchema } from "./strategy";

export type ToolKind = "strategy" | "ad" | "content" | "sales" | "customers" | "competitors";

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
    title: "Création de contenu",
    section: "/tableau-de-bord/contenus",
    options: CONTENT_OPTIONS,
    schema: contentSchema,
  }),
  sales: def({
    kind: "sales",
    title: "Optimisation des ventes",
    section: "/tableau-de-bord/sales-booster",
    options: SALES_OPTIONS,
    schema: salesSchema,
  }),
  customers: def({
    kind: "customers",
    title: "Recherche de clients",
    section: "/tableau-de-bord/clients-cibles",
    options: CUSTOMERS_OPTIONS,
    schema: customersSchema,
  }),
  competitors: def({
    kind: "competitors",
    title: "Concurrence",
    section: "/tableau-de-bord/concurrence",
    options: COMPETITORS_OPTIONS,
    schema: competitorsSchema,
  }),
} as const;

export function isToolKind(k: string): k is ToolKind {
  return k in TOOLS;
}
