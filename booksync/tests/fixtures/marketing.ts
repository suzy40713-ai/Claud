/** Exemples de sorties valides des outils du copilote (tests uniquement, jamais affichés en production). */
import type { AdOutput } from "@/domain/marketing/tools/ad";
import type { ContentOutput } from "@/domain/marketing/tools/content";
import type { SalesOutput } from "@/domain/marketing/tools/sales";
import type { Strategy } from "@/domain/marketing/tools/strategy";

export const STRATEGY: Strategy = {
  summary: "Montrer la fabrication des bougies sur TikTok pour créer la confiance.",
  positioning: "Des bougies faites main, en petites séries.",
  objectives: ["Faire 5 ventes", "Publier 20 vidéos", "Parler à 50 personnes"],
  launch: ["Préparer le profil", "Prévenir l'entourage", "Publier", "Faire le bilan"],
  budget: { total: "0 €", split: ["Tout gratuit"] },
  firstClients: ["Écrire à 30 proches", "Répondre vite", "Prix de lancement", "Groupes Facebook"],
  pillars: [{ title: "Coulisses", description: "La fabrication en vidéo." }],
  channels: [{ channel: "TikTok", role: "Découverte", frequency: "4 fois par semaine" }],
  weeks: [1, 2, 3, 4].map((week) => ({ week, focus: `Priorité de la semaine ${week}` })),
  days: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    theme: `Thème du jour ${i + 1}`,
    actions: [
      { title: `Filmer la coulée ${i + 1}`, detail: "15 secondes, lumière naturelle.", channel: "TikTok" },
      { title: "Répondre aux commentaires", detail: "10 minutes.", channel: "TikTok" },
      { title: "Noter les questions reçues", detail: "Dans un carnet.", channel: "Préparation" },
    ],
  })),
  measure: [{ metric: "Messages reçus", how: "Compter chaque semaine." }],
  assumptions: [{ text: "Les acheteurs aiment voir la fabrication.", basis: "hypothese" }],
};

export const AD: AdOutput = {
  variants: [
    {
      angle: "Fait main",
      headline: "Bougies faites main",
      primaryText: "Coulées à la main en petites séries.",
      cta: "Découvrir",
      visual: "Gros plan sur la cire qui coule.",
      script: [{ time: "0-2 s", text: "La cire coule dans le pot." }],
    },
  ],
  keywords: [],
  targeting: ["Intérêt décoration intérieure (hypothèse)"],
  testPlan: "5 € par jour pendant 4 jours, garder la meilleure variante.",
  rules: ["Pas d'allégation santé."],
};

export const CONTENT: ContentOutput = {
  pieces: [
    {
      title: "La coulée",
      hook: "Tu as déjà vu une bougie naître ?",
      development: ["Plan sur la cire", "Plan sur la mèche"],
      productMoment: "La bougie finie sur une étagère.",
      cta: "Le lien est dans la bio.",
      caption: "Coulée à la main, une par une.",
      hashtags: ["bougie", "faitmain", "deco"],
      onScreenText: "Une bougie, 24 h de travail",
    },
  ],
  calendar: [{ day: "Lundi", piece: "La coulée" }],
  tips: ["Filmer à la lumière du jour."],
};

export const SALES: SalesOutput = {
  diagnosis: "La page ne dit pas combien de temps brûle la bougie (hypothèse).",
  quickWins: [{ action: "Ajouter la durée de combustion", why: "Question fréquente.", effort: "faible" }],
  rewrites: [{ element: "Titre", proposal: "Bougie Lumi, 40 h de douceur" }],
  abTests: [{ element: "Bouton", versionA: "Acheter", versionB: "Je la veux", measure: "Clics" }],
  trust: ["Photo de l'atelier, si elle existe."],
  upsell: ["Lot de 3 bougies."],
};

export const CUSTOMERS = {
  personas: [
    {
      name: "Amoureux de déco cosy",
      description: "Aiment les intérieurs chaleureux.",
      needs: ["Créer une ambiance"],
      problems: ["Bougies industrielles qui sentent le chimique"],
      motivations: ["Se faire plaisir"],
      interests: ["Décoration", "Fait main"],
      arguments: ["Cire végétale"],
      channels: [{ platform: "Pinterest", how: "Épingles d'ambiance" }],
      basis: "fourni" as const,
    },
  ],
  toVerify: ["Prix acceptable ?"],
  firstSteps: ["Écrire à 10 personnes"],
};
