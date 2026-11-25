import { z } from "zod";
import { BASIS } from "../analysis";
import type { ToolOption } from "./options";

export const COMPETITORS_OPTIONS: readonly ToolOption[] = [
  {
    type: "text",
    name: "urls",
    label: "Sites de vos concurrents (1 à 3 adresses, une par ligne)",
    hint: "BookSync lit uniquement leur page publique. Sans adresse, l'analyse reste générale.",
    placeholder: "https://concurrent-un.fr\nhttps://concurrent-deux.fr",
    maxLength: 600,
    optional: true,
  },
  {
    type: "text",
    name: "notes",
    label: "Ce que vous savez déjà sur eux (facultatif)",
    placeholder: "Prix, réputation, ce que vos clients en disent…",
    maxLength: 1500,
    optional: true,
  },
];

export const competitorsSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: z.string().describe("Nom du concurrent ou de son site."),
        url: z.string().describe("Adresse analysée, ou vide."),
        positioning: z.string(),
        offers: z.array(z.string()),
        prices: z
          .array(z.string())
          .describe("Uniquement les prix trouvés dans la page fournie ; liste vide sinon."),
        arguments: z.array(z.string()),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        basis: z.enum(BASIS).describe("fourni si tiré de la page ou des notes, sinon hypothese."),
      }),
    )
    .describe("Un élément par concurrent analysé."),
  differentiation: z.array(z.string()).describe("3 à 5 façons de vous différencier."),
  opportunities: z.array(z.string()).describe("Opportunités laissées par les concurrents."),
  limits: z.string().describe("Ce que cette analyse ne permet pas de savoir."),
});

export type CompetitorsOutput = z.infer<typeof competitorsSchema>;

/** Adresses saisies (une par ligne) : 3 au maximum, http(s) uniquement. */
export function parseCompetitorUrls(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\n,;\s]+/)) {
    const v = raw.trim();
    if (!v) continue;
    try {
      const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      if (!/^https?:$/.test(url.protocol) || url.username || url.password) continue;
      if (!url.hostname.includes(".")) continue;
      if (!out.includes(url.toString())) out.push(url.toString());
    } catch {
      /* adresse ignorée */
    }
    if (out.length === 3) break;
  }
  return out;
}
