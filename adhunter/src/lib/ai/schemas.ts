import { z } from "zod";

export const analysisSchema = z.object({
  summary: z.string().describe("Résumé en 2 phrases de la publicité et de sa stratégie"),
  hook: z.object({
    text: z.string().describe("L'accroche identifiée (citation courte ou description)"),
    type: z.string().describe("Type d'accroche : question, problème, bénéfice, curiosité, preuve sociale…"),
    analysis: z.string().describe("Pourquoi cette accroche fonctionne ou non"),
  }),
  target_audience: z.object({
    description: z.string(),
    segments: z.array(z.string()).describe("2 à 4 segments probables"),
    awareness_level: z.string().describe("Niveau de conscience estimé (inconscient, conscient du problème, de la solution, du produit…)"),
  }),
  problem_solved: z.string(),
  marketing_techniques: z.array(z.object({ name: z.string(), explanation: z.string() })).describe("3 à 6 techniques"),
  strengths: z.array(z.string()).describe("3 à 5 éléments qui rendent la publicité intéressante"),
  weaknesses: z.array(z.string()).describe("2 à 4 faiblesses ou risques"),
  ad_ideas: z
    .array(z.object({ title: z.string(), hook: z.string(), concept: z.string(), format: z.string() }))
    .describe("Exactement 3 idées originales inspirées des principes, jamais une copie"),
  recommendations: z.array(z.string()).describe("4 à 6 recommandations concrètes pour améliorer sa propre publicité"),
  confidence_note: z.string().describe("Limites de l'analyse (données manquantes, visuel non disponible…)"),
});

export type AdAnalysis = z.infer<typeof analysisSchema>;

export const creatorInputSchema = z.object({
  productName: z.string().trim().min(2, "Le nom du produit est requis.").max(80),
  description: z.string().trim().min(20, "Décris ton produit en au moins 20 caractères.").max(1500),
  audience: z.string().trim().min(3, "Précise ton public cible.").max(300),
  platform: z.enum(["tiktok", "instagram", "facebook", "all"]),
  tone: z.enum(["professionnel", "amical", "inspirant", "humoristique", "urgent", "premium"]),
  goal: z.enum(["ventes", "notoriete", "leads", "trafic", "installations"]),
});

export type CreatorInput = z.infer<typeof creatorInputSchema>;

export const creationSchema = z.object({
  hooks: z.array(z.string()).describe("Exactement 5 accroches différentes"),
  ad_copies: z
    .array(z.object({ angle: z.string(), text: z.string() }))
    .describe("Exactement 3 textes publicitaires complets"),
  ctas: z.array(z.string()).describe("Exactement 3 appels à l'action"),
  video_concepts: z
    .array(
      z.object({
        title: z.string(),
        duration: z.string(),
        scenes: z.array(z.string()).describe("3 à 5 plans décrits brièvement"),
      })
    )
    .describe("Exactement 3 concepts de vidéos courtes"),
  visual_suggestions: z.array(z.string()).describe("3 à 5 suggestions de visuels"),
  platform_variants: z.object({
    tiktok: z.string().describe("Variante adaptée à TikTok (ton natif, texte court, hashtags pertinents)"),
    instagram: z.string().describe("Variante adaptée à Instagram"),
    facebook: z.string().describe("Variante adaptée à Facebook"),
  }),
});

export type AdCreation = z.infer<typeof creationSchema>;

export const GOAL_LABELS: Record<CreatorInput["goal"], string> = {
  ventes: "Générer des ventes",
  notoriete: "Développer la notoriété",
  leads: "Collecter des leads",
  trafic: "Générer du trafic",
  installations: "Obtenir des installations d'app",
};

export const TONE_LABELS: Record<CreatorInput["tone"], string> = {
  professionnel: "Professionnel",
  amical: "Amical",
  inspirant: "Inspirant",
  humoristique: "Humoristique",
  urgent: "Urgent",
  premium: "Premium",
};

export const PLATFORM_LABELS: Record<CreatorInput["platform"], string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  all: "Toutes les plateformes",
};
