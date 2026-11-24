/** Point d'entrée des modèles gratuits du copilote (aucune IA, aucun coût). */
import type { ToolKind } from "../tools";
import type { ToolOptionValues } from "../tools/options";
import { adTemplate } from "./ad";
import { analysisTemplate } from "./analysis";
import type { ProductInfo } from "./common";
import { contentTemplate } from "./content";
import { salesTemplate } from "./sales";
import { strategyTemplate } from "./strategy";

export { analysisTemplate };
export type { ProductInfo };

export function runTemplate(kind: ToolKind, p: ProductInfo, v: ToolOptionValues, seed: number) {
  const s = (k: string) => String(v[k] ?? "");
  switch (kind) {
    case "strategy":
      return strategyTemplate(p, { objective: s("objective"), time: s("time"), budget: s("budget"), channels: (v.channels as string[]) ?? [] }, seed);
    case "ad":
      return adTemplate(p, { platform: s("platform"), style: s("style"), offer: s("offer") }, seed);
    case "content":
      return contentTemplate(p, { platform: s("platform"), format: s("format"), goal: s("goal") }, seed);
    case "sales":
      return salesTemplate(p, { problem: s("problem"), pageText: s("pageText") });
  }
}
