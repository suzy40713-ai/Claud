function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET"),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  coachModel: process.env.COACH_MODEL ?? "claude-sonnet-5",

  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:contact@sports-coach.example",
  overloadCheckIntervalMs: Number(process.env.OVERLOAD_CHECK_INTERVAL_MS ?? 6 * 60 * 60 * 1000),

  stravaClientId: process.env.STRAVA_CLIENT_ID,
  stravaClientSecret: process.env.STRAVA_CLIENT_SECRET,
  stravaRedirectUri:
    process.env.STRAVA_REDIRECT_URI ?? `${process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"}/strava/callback`,
};
