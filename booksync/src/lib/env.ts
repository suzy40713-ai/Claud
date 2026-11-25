import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Variables d'environnement validées au démarrage.
 * Une variable manquante ou invalide fait échouer le démarrage avec un message clair,
 * plutôt qu'une erreur obscure en production.
 */
/**
 * Clé facultative : une valeur vide, trop courte ou mal collée est ignorée (avec un avertissement)
 * au lieu de faire planter tout le site.
 */
const optionalSecret = z.preprocess((v) => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return undefined;
  if (t.length < 16) {
    console.warn("[env] clé d'IA ignorée : valeur trop courte, vérifiez-la dans Render");
    return undefined;
  }
  return t;
}, z.string().optional());

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
    /**
     * Confirmation de l'email :
     * - on : obligatoire avant d'utiliser le compte ;
     * - souple : l'email de confirmation est envoyé, mais le compte est utilisable tout de suite
     *   (aucun visiteur bloqué si l'email arrive en retard ou dans les spams) ;
     * - off : aucun email de confirmation (envoi d'emails non opérationnel).
     */
    EMAIL_VERIFICATION: z
      .enum(["on", "souple", "off"])
      .default("on")
      .transform((v) => ({ required: v === "on", send: v !== "off" })),
    /** Clé Resend. Absente : les emails sont journalisés en base sans être envoyés (développement). */
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    EMAIL_FROM: z.string().min(3).default("BookSync <onboarding@resend.dev>"),
    /** Connexion avec Google (Google Cloud Console → Identifiants → ID client OAuth). */
    GOOGLE_CLIENT_ID: z.string().min(10).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(10).optional(),
    /** Stripe Billing (mode test : sk_test_…). */
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    STRIPE_CONNECT_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    STRIPE_PRICE_STARTER: z.string().startsWith("price_").optional(),
    STRIPE_PRICE_PRO: z.string().startsWith("price_").optional(),
    STRIPE_PRICE_BUSINESS: z.string().startsWith("price_").optional(),
    /** Secret partagé avec le planificateur (Supabase pg_cron) pour /api/cron/*. */
    CRON_SECRET: z.string().min(24).optional(),
    /**
     * IA gratuite (aucun frais) : Groq en premier, Cloudflare Workers AI en secours, puis les
     * modèles BookSync intégrés. Sans clé, BookSync utilise seulement ses modèles intégrés.
     * Ne jamais enregistrer de carte bancaire chez ces fournisseurs : aucun prélèvement possible.
     */
    GROQ_API_KEY: optionalSecret,
    GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
    /** Appels Groq par jour, sous le quota gratuit (environ 1 000 par jour en 2026). */
    GROQ_DAILY_CAP: z.coerce.number().int().min(0).max(100000).default(800),
    CLOUDFLARE_ACCOUNT_ID: optionalSecret,
    CLOUDFLARE_AI_TOKEN: optionalSecret,
    CLOUDFLARE_AI_MODEL: z.string().default("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    /** Appels Cloudflare par jour, sous les 10 000 « neurones » gratuits quotidiens. */
    CLOUDFLARE_DAILY_CAP: z.coerce.number().int().min(0).max(100000).default(60),
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
    EMAIL_VERIFICATION: process.env.EMAIL_VERIFICATION,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CONNECT_WEBHOOK_SECRET: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
    CRON_SECRET: process.env.CRON_SECRET,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
    GROQ_DAILY_CAP: process.env.GROQ_DAILY_CAP,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_AI_TOKEN: process.env.CLOUDFLARE_AI_TOKEN,
    CLOUDFLARE_AI_MODEL: process.env.CLOUDFLARE_AI_MODEL,
    CLOUDFLARE_DAILY_CAP: process.env.CLOUDFLARE_DAILY_CAP,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Permet le build Docker sans secrets (ils sont injectés à l'exécution par Render).
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
  emptyStringAsUndefined: true,
});
