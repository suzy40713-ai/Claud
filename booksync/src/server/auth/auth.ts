import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { sendEmail } from "@/server/email/send";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import { TERMS_VERSION } from "@/lib/legal";
import {
  existingAccountTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "@/server/email/templates";

export { TERMS_VERSION };
export const PASSWORD_MIN_LENGTH = PASSWORD_MIN;

export const auth = betterAuth({
  appName: "BookSync",
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  advanced: {
    cookiePrefix: "booksync",
    database: { generateId: "uuid" },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    // Protection contre l'énumération : l'inscription avec un email existant répond comme un succès,
    // et le titulaire du compte est prévenu par email.
    async onExistingUserSignUp({ user }) {
      await sendEmail(
        user.email,
        existingAccountTemplate({
          name: user.name,
          signInUrl: `${env.NEXT_PUBLIC_APP_URL}/connexion`,
          resetUrl: `${env.NEXT_PUBLIC_APP_URL}/mot-de-passe-oublie`,
        }),
      );
    },
    async sendResetPassword({ user, url }) {
      await sendEmail(user.email, resetPasswordTemplate({ name: user.name, url }));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    async sendVerificationEmail({ user, url }) {
      await sendEmail(user.email, verifyEmailTemplate({ name: user.name, url }));
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Pas de cache cookie : chaque requête relit la session en base (révocation immédiate, données à jour).
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: env.AUTH_RATE_LIMIT,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  user: {
    additionalFields: {
      termsAcceptedAt: { type: "date", required: false, input: false },
      termsVersion: { type: "string", required: false, input: false },
    },
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        }
      : {},
  account: {
    // Un compte créé par email et une connexion Google avec la même adresse vérifiée = un seul compte.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  databaseHooks: {
    user: {
      create: {
        // Les conditions générales sont obligatoires à l'inscription par email.
        // (Inscription Google : l'acceptation est demandée avant l'accès à l'application.)
        async before(user, ctx) {
          if (ctx?.path === "/sign-up/email") {
            const accepted = (ctx.body as { acceptTerms?: unknown } | undefined)?.acceptTerms === true;
            if (!accepted) {
              throw new APIError("BAD_REQUEST", {
                code: "TERMS_NOT_ACCEPTED",
                message: "Vous devez accepter les conditions générales.",
              });
            }
            return { data: { ...user, termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION } };
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
