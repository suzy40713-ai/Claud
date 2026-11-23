import { z } from "zod";
import type { ToolOption } from "./options";

export const CONTENT_OPTIONS: readonly ToolOption[] = [
  {
    type: "select",
    name: "platform",
    label: "Plateforme",
    default: "tiktok",
    choices: [
      { value: "tiktok", label: "TikTok" },
      { value: "instagram", label: "Instagram" },
      { value: "youtube", label: "YouTube Shorts" },
      { value: "facebook", label: "Facebook" },
      { value: "linkedin", label: "LinkedIn" },
    ],
  },
  {
    type: "select",
    name: "format",
    label: "Format",
    default: "video",
    choices: [
      { value: "video", label: "Vidéos courtes (scripts)" },
      { value: "carousel", label: "Carrousels" },
      { value: "post", label: "Posts texte et image" },
    ],
  },
  {
    type: "select",
    name: "goal",
    label: "But des contenus",
    default: "vendre",
    choices: [
      { value: "decouvrir", label: "Faire découvrir le produit" },
      { value: "eduquer", label: "Apprendre quelque chose d'utile" },
      { value: "confiance", label: "Donner confiance (coulisses, fabrication)" },
      { value: "vendre", label: "Pousser à l'achat" },
    ],
  },
];

export const contentSchema = z.object({
  pieces: z
    .array(
      z.object({
        title: z.string().describe("Titre interne du contenu."),
        hook: z.string().describe("Accroche : première phrase ou première slide."),
        development: z
          .array(z.string())
          .describe("Vidéo : plans successifs. Carrousel : une entrée par slide. Post : paragraphes."),
        productMoment: z.string().describe("Comment le produit apparaît, sans forcer."),
        cta: z.string().describe("Appel à l'action final."),
        caption: z.string().describe("Légende à publier."),
        hashtags: z.array(z.string()).describe("3 à 5 hashtags, sans le #."),
        onScreenText: z.string().describe("Texte affiché à l'écran (vidéo) ou vide."),
      }),
    )
    .describe("5 contenus différents."),
  calendar: z
    .array(z.object({ day: z.string(), piece: z.string() }))
    .describe("Proposition de publication sur une semaine (jour de la semaine et titre du contenu)."),
  tips: z.array(z.string()).describe("3 conseils de tournage ou de mise en forme."),
});

export type ContentOutput = z.infer<typeof contentSchema>;

export const CONTENT_INSTRUCTIONS = `Outil : générateur de contenus.
Écris 5 contenus prêts à publier pour la plateforme, le format et le but choisis.
- Structure de chaque contenu : accroche, développement, moment produit, appel à l'action.
- Contenus réalisables seul, au téléphone, sans montrer son visage si ce n'est pas nécessaire.
- Ton naturel, phrases courtes, pas de jargon marketing. Hashtags pertinents, sans le #.
- N'invente ni témoignage, ni chiffre, ni avis client. Aucune promesse de viralité ou de ventes.`;
