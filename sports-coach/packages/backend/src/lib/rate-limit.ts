import rateLimit from "express-rate-limit";

/**
 * Limite stricte sur les tentatives de connexion/inscription pour ralentir
 * le brute-force sur les mots de passe. Compte par IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Reessaie dans quelques minutes." },
});

/**
 * Garde-fou general sur le reste de l'API (defense en profondeur, pas la
 * ligne de defense principale).
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requetes, ralentis un peu." },
});
