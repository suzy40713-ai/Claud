import { z } from "zod";
import { BASIS } from "../analysis";
import type { ToolOption } from "./options";

export const CUSTOMERS_OPTIONS: readonly ToolOption[] = [
  {
    type: "select",
    name: "market",
    label: "Où vendez-vous ?",
    default: "france",
    choices: [
      { value: "local", label: "Dans ma ville ou ma région" },
      { value: "france", label: "Partout en France" },
      { value: "francophone", label: "Dans les pays francophones" },
    ],
  },
  {
    type: "select",
    name: "buyer",
    label: "Vous vendez surtout à…",
    default: "particuliers",
    choices: [
      { value: "particuliers", label: "Des particuliers" },
      { value: "pros", label: "Des professionnels" },
      { value: "les-deux", label: "Les deux" },
    ],
  },
];

export const customersSchema = z.object({
  personas: z
    .array(
      z.object({
        name: z.string().describe("Nom court du profil (ex. « La maman active »)."),
        description: z.string(),
        needs: z.array(z.string()).describe("2 à 3 besoins."),
        problems: z.array(z.string()).describe("2 à 3 problèmes ou frustrations."),
        motivations: z.array(z.string()).describe("2 à 3 motivations d'achat."),
        interests: z.array(z.string()).describe("3 à 5 centres d'intérêt utiles pour le ciblage."),
        arguments: z.array(z.string()).describe("2 à 3 arguments commerciaux adaptés à ce profil."),
        channels: z
          .array(z.object({ platform: z.string(), how: z.string() }))
          .describe("2 à 3 endroits où l'atteindre et comment."),
        basis: z.enum(BASIS),
      }),
    )
    .describe("3 profils de clients idéaux."),
  toVerify: z.array(z.string()).describe("Questions à poser à de vrais clients pour valider ces profils."),
  firstSteps: z.array(z.string()).describe("3 actions pour contacter ces clients cette semaine."),
});

export type CustomersOutput = z.infer<typeof customersSchema>;
