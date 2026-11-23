import { z } from "zod";
import type { ToolOption } from "./options";

export const AD_PLATFORMS = [
  { value: "tiktok", label: "TikTok Ads" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google Ads (Réseau de Recherche)" },
] as const;

export const AD_STYLES = [
  { value: "probleme", label: "Problème / solution" },
  { value: "demo", label: "Démonstration du produit" },
  { value: "story", label: "Storytelling" },
  { value: "avant-apres", label: "Avant / après" },
  { value: "humour", label: "Humour" },
] as const;

export const AD_OPTIONS: readonly ToolOption[] = [
  { type: "select", name: "platform", label: "Plateforme", default: "tiktok", choices: AD_PLATFORMS },
  { type: "select", name: "style", label: "Style", default: "probleme", choices: AD_STYLES },
  {
    type: "text",
    name: "offer",
    label: "Offre réelle à mettre en avant (facultatif)",
    hint: "Uniquement une offre que vous proposez vraiment, par exemple « livraison offerte dès 30 € ».",
    placeholder: "Livraison offerte dès 30 €",
    maxLength: 200,
    optional: true,
  },
];

export const adSchema = z.object({
  variants: z
    .array(
      z.object({
        angle: z.string().describe("L'idée de la variante en quelques mots."),
        headline: z.string().describe("Titre. Google : 30 caractères maximum."),
        primaryText: z.string().describe("Texte principal. Google : description de 90 caractères maximum."),
        cta: z.string().describe("Bouton ou appel à l'action."),
        visual: z.string().describe("Description du visuel ou de la vidéo à produire soi-même."),
        script: z
          .array(z.object({ time: z.string(), text: z.string() }))
          .describe("Déroulé d'une vidéo de 15 à 30 s (vide pour Google)."),
      }),
    )
    .describe("3 variantes différentes à tester."),
  keywords: z.array(z.string()).describe("Google uniquement : 10 mots-clés à tester, sinon liste vide."),
  targeting: z
    .array(z.string())
    .describe("Idées de ciblage, toutes des hypothèses à tester (centres d'intérêt, âge, lieu)."),
  testPlan: z.string().describe("Comment tester ces variantes avec un petit budget et quand arrêter."),
  rules: z
    .array(z.string())
    .describe("Points de règlement publicitaire de la plateforme à respecter pour ce produit."),
});

export type AdOutput = z.infer<typeof adSchema>;

export const AD_INSTRUCTIONS = `Outil : créateur de publicités.
Écris 3 variantes de publicité pour la plateforme et le style choisis.
- Pour Google Ads : titres de 30 caractères maximum, descriptions de 90 caractères maximum, pas de script vidéo, 10 mots-clés.
- Pour TikTok, Instagram, Facebook : une vidéo verticale tournable au téléphone, accroche dans les 2 premières secondes.
- N'invente aucune offre, aucun avis client, aucun chiffre, aucune caution d'expert. Utilise uniquement l'offre réelle fournie, sinon aucune offre.
- Aucune promesse de résultat garanti, pas de fausse urgence ni de faux compte à rebours.
- Le ciblage proposé est une hypothèse à tester, présente-le comme tel.`;

export const GOOGLE_LIMITS = { headline: 30, description: 90 } as const;
