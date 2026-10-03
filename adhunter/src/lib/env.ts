/**
 * Central place to know which external integrations are configured. Every
 * feature that depends on one checks here and shows a clear
 * "en préparation / configuration requise" state instead of faking results.
 */
export const integrations = {
  supabase: () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseAdmin: () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  stripe: () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
  ai: () => Boolean(process.env.ANTHROPIC_API_KEY),
  meta: () => Boolean(process.env.META_ACCESS_TOKEN),
  tiktok: () => Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
};

/** Demo mode: enables the clearly-labelled demo ad source and demo AI outputs. */
export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
