import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Variables d'environnement validées au démarrage.
 * Une variable manquante ou invalide fait échouer le démarrage avec un message clair,
 * plutôt qu'une erreur obscure en production.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), {
        message: "DATABASE_URL doit être une URL PostgreSQL",
      }),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().max(100).default(10),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET doit faire au moins 32 caractères"),
    /** Désactivable uniquement pour les tests de bout en bout. */
    AUTH_RATE_LIMIT: z
      .enum(["on", "off"])
      .default("on")
      .transform((v) => v === "on"),
    /** Clé Resend. Absente : les emails sont journalisés en base sans être envoyés (développement). */
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    EMAIL_FROM: z.string().min(3).default("BookSync <onboarding@resend.dev>"),
    /** Connexion avec Google (Google Cloud Console → Identifiants → ID client OAuth). */
    GOOGLE_CLIENT_ID: z.string().min(10).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(10).optional(),
    /** Stripe Billing (mode test : sk_test_…). */
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    STRIPE_PRICE_STARTER: z.string().startsWith("price_").optional(),
    STRIPE_PRICE_PRO: z.string().startsWith("price_").optional(),
    /** Secret partagé avec le planificateur (Supabase pg_cron) pour /api/cron/*. */
    CRON_SECRET: z.string().min(24).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    AUTH_RATE_LIMIT: process.env.AUTH_RATE_LIMIT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Permet le build Docker sans secrets (ils sont injectés à l'exécution par Render).
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
  emptyStringAsUndefined: true,
});
