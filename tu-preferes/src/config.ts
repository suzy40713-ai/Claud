// Tous les timings sont en frames (30 fps).
export const FPS = 30;

// Accroche : très courte, la 1re question doit apparaître vite.
export const HOOK_DURATION = 45; // 1,5 s

// Une question = entrée + compte à rebours + révélation des %.
// Ce sont des minimums : avec la voix off, les durées s'allongent
// pour laisser la voix finir (voir timeline.ts).
export const Q_ENTER = 12; // 0,4 s : les deux choix arrivent
export const Q_COUNTDOWN = 90; // 3 s : le spectateur choisit
export const Q_REVEAL = 66; // 2,2 s : les pourcentages tombent

// CTA final (follow + commentaire)
export const OUTRO_DURATION = 105; // 3,5 s

// Après quelle question afficher le mini-CTA "abonne-toi" (index 0-based)
export const MID_CTA_AFTER = 2;

// Zones de sécurité TikTok (UI de l'app par-dessus la vidéo)
export const SAFE_TOP = 170;
export const SAFE_BOTTOM = 360;
export const SAFE_RIGHT = 150;

export const COLOR_A = "#ff3b5c";
export const COLOR_B = "#2f7bff";
