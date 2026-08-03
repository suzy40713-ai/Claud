// Un seul endroit a modifier pour changer l'identite visuelle de toutes les
// videos generees (couleurs, police, tailles). Les composants ne doivent
// jamais contenir de valeurs codees en dur : ils lisent ce fichier.

export const theme = {
  colors: {
    background: "#ffffff",
    ink: "#0d0d10", // texte noir principal
    numberGhost: "rgba(20, 20, 24, 0.10)", // le tres grand chiffre en fond
    accent: "#FF2D6F", // fleches, touches de couleur (rose vif)
    accentSoft: "rgba(255, 45, 111, 0.14)",
    watermarkText: "rgba(13, 13, 16, 0.55)",
  },
  font: {
    family: "Poppins",
    weightBlack: "800", // Poppins ExtraBold
    weightBold: "700",
    weightRegular: "500",
  },
  sizes: {
    numberGhost: 620,
    arcTitle: 64,
    instruction: 46,
    watermark: 30,
  },
  layout: {
    width: 1080,
    height: 1920,
    safeMarginX: 60,
  },
} as const;

export type Theme = typeof theme;
