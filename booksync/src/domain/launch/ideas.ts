/**
 * « Je ne sais pas quoi proposer » : idées de services à vendre sans diplôme, à partir de ce
 * que la personne sait déjà faire. Modèles fixes (aucune IA). Les prix sont des points de départ.
 */
import type { LaunchActivity, LaunchPlace } from "./plan";

export type LaunchIdea = {
  id: string;
  title: string;
  why: string;
  activity: LaunchActivity;
  place: LaunchPlace;
  services: Array<{ name: string; durationMinutes: number; priceCents: number }>;
};

export type Talent = { id: string; label: string; emoji: string; ideas: LaunchIdea[] };

export const TALENTS: Talent[] = [
  {
    id: "langue",
    label: "Je parle une autre langue",
    emoji: "🌍",
    ideas: [
      {
        id: "conversation",
        title: "Cours de conversation en visio",
        why: "Beaucoup de gens veulent juste pratiquer à l'oral avec quelqu'un de patient. Pas besoin d'être prof : tu parles, tu corriges, tu encourages.",
        activity: "cours",
        place: "en-ligne",
        services: [
          { name: "Cours d'essai", durationMinutes: 20, priceCents: 0 },
          { name: "Conversation", durationMinutes: 45, priceCents: 2000 },
        ],
      },
    ],
  },
  {
    id: "ecole",
    label: "J'étais bon(ne) à l'école",
    emoji: "📚",
    ideas: [
      {
        id: "devoirs",
        title: "Aide aux devoirs (primaire, collège)",
        why: "Les parents cherchent quelqu'un de sérieux pour aider leurs enfants après l'école. Tu peux le faire chez eux ou en visio.",
        activity: "cours",
        place: "en-ligne",
        services: [
          { name: "Aide aux devoirs", durationMinutes: 60, priceCents: 1500 },
          { name: "Préparation d'un contrôle", durationMinutes: 90, priceCents: 2200 },
        ],
      },
    ],
  },
  {
    id: "numerique",
    label: "Je suis à l'aise avec le téléphone et l'ordi",
    emoji: "📱",
    ideas: [
      {
        id: "seniors",
        title: "Aide numérique pour les seniors",
        why: "Installer WhatsApp, faire une démarche en ligne, envoyer des photos : ce qui est simple pour toi bloque beaucoup de personnes âgées.",
        activity: "cours",
        place: "domicile",
        services: [
          { name: "Séance d'aide numérique", durationMinutes: 60, priceCents: 2500 },
          { name: "Installation téléphone neuf", durationMinutes: 60, priceCents: 3000 },
        ],
      },
    ],
  },
  {
    id: "reseaux",
    label: "Je passe du temps sur TikTok ou Instagram",
    emoji: "🤳",
    ideas: [
      {
        id: "community",
        title: "Gestion Instagram pour les commerçants",
        why: "Boulangeries, coiffeurs, restaurants : beaucoup n'ont pas le temps de poster. Tu sais ce qui marche, eux non.",
        activity: "freelance",
        place: "en-ligne",
        services: [
          { name: "Appel découverte", durationMinutes: 20, priceCents: 0 },
          { name: "Séance création de contenus", durationMinutes: 60, priceCents: 4000 },
        ],
      },
    ],
  },
  {
    id: "musique",
    label: "Je joue d'un instrument",
    emoji: "🎸",
    ideas: [
      {
        id: "instrument",
        title: "Cours d'instrument pour débutants",
        why: "Un débutant n'a pas besoin d'un virtuose : il a besoin de quelqu'un qui lui apprend les 5 premiers morceaux.",
        activity: "cours",
        place: "en-ligne",
        services: [
          { name: "Cours débutant", durationMinutes: 45, priceCents: 2000 },
          { name: "Cours", durationMinutes: 60, priceCents: 2500 },
        ],
      },
    ],
  },
  {
    id: "cuisine",
    label: "J'aime cuisiner",
    emoji: "🍳",
    ideas: [
      {
        id: "atelier-cuisine",
        title: "Ateliers cuisine en visio",
        why: "Tes recettes de famille intéressent : les gens réservent pour cuisiner avec toi, chacun dans sa cuisine.",
        activity: "cours",
        place: "en-ligne",
        services: [{ name: "Atelier cuisine", durationMinutes: 60, priceCents: 2000 }],
      },
    ],
  },
  {
    id: "organisation",
    label: "Je suis organisé(e)",
    emoji: "🗂️",
    ideas: [
      {
        id: "admin",
        title: "Aide administrative et organisation",
        why: "Papiers, dossiers, classement, prise de rendez-vous : plein de gens détestent ça et paient pour être aidés.",
        activity: "consultation",
        place: "en-ligne",
        services: [
          { name: "Séance d'aide administrative", durationMinutes: 60, priceCents: 2500 },
          { name: "Point rapide", durationMinutes: 30, priceCents: 1500 },
        ],
      },
    ],
  },
  {
    id: "photo",
    label: "J'aime prendre des photos",
    emoji: "📸",
    ideas: [
      {
        id: "portrait",
        title: "Séances photo portrait (réseaux, CV, LinkedIn)",
        why: "Tout le monde a besoin d'une belle photo de profil, mais personne n'aime ses selfies. Un bon téléphone et une belle lumière suffisent pour commencer.",
        activity: "photographie",
        place: "domicile",
        services: [
          { name: "Séance portrait", durationMinutes: 30, priceCents: 3000 },
          { name: "Séance portrait (10 photos)", durationMinutes: 60, priceCents: 5000 },
        ],
      },
    ],
  },
];

export function findIdea(ideaId: string) {
  for (const t of TALENTS) {
    const idea = t.ideas.find((i) => i.id === ideaId);
    if (idea) return idea;
  }
  return null;
}
