import "server-only";
import { z } from "zod";

/** Variables d'environnement, lues à la demande (le build n'a besoin d'aucun secret). */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  VIDAIA_SECRET: z.string().min(32, "VIDAIA_SECRET : au moins 32 caractères aléatoires"),
  GROQ_API_KEY: z.string().min(16).optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  ELEVENLABS_API_KEY: z.string().min(16).optional(),
  ELEVENLABS_VOICE_ID: z.string().default("Hy28BjVfgieDVMiyQpQe"),
  ELEVENLABS_MODEL: z.string().default("eleven_multilingual_v2"),
  /** Plafond de vidéos générées par jour (toutes clientes confondues) : protège les crédits ElevenLabs. */
  VIDEO_DAILY_CAP: z.coerce.number().int().min(0).default(30),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  EMAIL_FROM: z.string().default("VidaIA <onboarding@resend.dev>"),
});

export type Env = z.infer<typeof schema>;
let cached: Env | null = null;

export function env(): Env {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}
