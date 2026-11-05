import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { sendEmail } from "@/server/email/send";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import {
  existingAccountTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "@/server/email/templates";

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
    cookieCache: { enabled: true, maxAge: 5 * 60 },
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
  databaseHooks: {
    session: {
      create: {
        // À la connexion, on réactive automatiquement la première entreprise de l'utilisateur.
        async before(session) {
          const [membership] = await db
            .select({ organizationId: schema.member.organizationId })
            .from(schema.member)
            .where(eq(schema.member.userId, session.userId))
            .orderBy(asc(schema.member.createdAt))
            .limit(1);
          return { data: { ...session, activeOrganizationId: membership?.organizationId ?? null } };
        },
      },
    },
  },
  plugins: [
    organization({
      creatorRole: "owner",
      organizationLimit: 10,
      schema: {
        organization: {
          additionalFields: {
            timezone: { type: "string", required: true, defaultValue: "Europe/Paris", input: true },
          },
        },
      },
    }),
    nextCookies(), // doit rester en dernier
  ],
});

export type Session = typeof auth.$Infer.Session;
