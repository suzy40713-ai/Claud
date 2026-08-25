// Les valeurs collees depuis un dashboard (Stripe, etc.) embarquent parfois un
// caractere invisible parasite (espace insecable, caractere de largeur nulle,
// marque de direction...) suite a une selection tactile sur mobile d'un texte
// affiche replie sur plusieurs lignes. \s ne capture pas toutes ces variantes.
// Un en-tete HTTP contenant un tel caractere fait planter Node
// (ERR_INVALID_CHAR). Ces valeurs (cles API, secrets) ne sont jamais composees
// que de lettres, chiffres, "_" et "-" : on ne garde que ces caracteres.
function sanitizeToken(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "");
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value ? sanitizeToken(value) : undefined;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET"),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  // Origines supplementaires autorisees en CORS (ex: "https://localhost" pour
  // l'app mobile Capacitor), separees par des virgules.
  additionalCorsOrigins: (process.env.ADDITIONAL_CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  // "lax" convient au web (front et back sur le meme "site"). L'app mobile
  // packagee (Capacitor) tourne sur une origine differente du backend
  // deploye : il faut alors "none" (+ Secure, cf. auth.routes.ts) pour que
  // le cookie de session soit envoye.
  cookieSameSite: (process.env.COOKIE_SAME_SITE as "lax" | "none" | "strict" | undefined) ?? "lax",
  nodeEnv: process.env.NODE_ENV ?? "development",
  anthropicApiKey: optional("ANTHROPIC_API_KEY"),
  coachModel: process.env.COACH_MODEL ?? "claude-sonnet-5",

  vapidPublicKey: optional("VAPID_PUBLIC_KEY"),
  vapidPrivateKey: optional("VAPID_PRIVATE_KEY"),
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:contact@sports-coach.example",
  overloadCheckIntervalMs: Number(process.env.OVERLOAD_CHECK_INTERVAL_MS ?? 6 * 60 * 60 * 1000),

  stravaClientId: optional("STRAVA_CLIENT_ID"),
  stravaClientSecret: optional("STRAVA_CLIENT_SECRET"),
  stravaRedirectUri:
    process.env.STRAVA_REDIRECT_URI ?? `${process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"}/strava/callback`,

  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  stripePremiumPriceId: optional("STRIPE_PREMIUM_PRICE_ID"),

  // Prix de l'ebook "Transformation 90 Jours", en centimes. Pas besoin de
  // creer un Price cote Stripe Dashboard : la session Checkout est creee
  // avec un price_data inline (montant defini ici).
  ebookPriceCents: Number(process.env.EBOOK_PRICE_CENTS ?? 2999),
  ebookCompareAtPriceCents: Number(process.env.EBOOK_COMPARE_AT_PRICE_CENTS ?? 4999),

  resendApiKey: optional("RESEND_API_KEY"),
  // "onboarding@resend.dev" fonctionne sans domaine verifie mais avec des
  // limitations d'envoi (volume/destinataires) cote Resend : a remplacer par
  // une adresse sur un domaine verifie des que possible.
  ebookSenderEmail: process.env.EBOOK_SENDER_EMAIL ?? "Cadenzo <onboarding@resend.dev>",

  // Frequence de verification des relances email a envoyer aux leads
  // captures (mini-guide gratuit). 1h par defaut : suffisant vu que les
  // relances elles-memes sont espacees de plusieurs jours.
  leadNurtureIntervalMs: Number(process.env.LEAD_NURTURE_INTERVAL_MS ?? 60 * 60 * 1000),
};
