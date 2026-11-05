/**
 * Tables d'authentification et d'organisation (format attendu par Better Auth).
 * Les noms de colonnes sont convertis en snake_case par Drizzle (`casing: "snake_case"`).
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid().primaryKey().defaultRandom();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const user = pgTable("user", {
  id: id(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  /** Acceptation des conditions générales (obligatoire). */
  termsAcceptedAt: timestamp({ withTimezone: true }),
  termsVersion: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: id(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: id(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("account_user_id_idx").on(t.userId),
    uniqueIndex("account_provider_account_uq").on(t.providerId, t.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: id(),
  key: text().notNull().unique(),
  count: bigint({ mode: "number" }).notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});

/** Une organisation = un compte client BookSync (salon, cabinet, studio, garage…). */
export const organization = pgTable(
  "organization",
  {
    id: id(),
    name: text().notNull(),
    /** Identifiant public utilisé dans l'URL de la page de réservation : booksync.fr/{slug} */
    slug: text().notNull().unique(),
    activity: text(),
    description: text(),
    logoFileId: uuid(),
    email: text(),
    phone: text(),
    addressLine1: text(),
    addressLine2: text(),
    postalCode: text(),
    city: text(),
    country: text().notNull().default("FR"),
    timezone: text().notNull().default("Europe/Paris"),
    currency: text().notNull().default("EUR"),
    /** Réglages de réservation en ligne */
    bookingEnabled: boolean().notNull().default(true),
    minNoticeMinutes: integer().notNull().default(120),
    maxAdvanceDays: integer().notNull().default(60),
    slotIntervalMinutes: integer().notNull().default(15),
    cancellationNoticeHours: integer().notNull().default(24),
    /** Personnalisation de la page de réservation (plan Pro) */
    brandColor: text(),
    coverFileId: uuid(),
    welcomeMessage: text(),
    /** Notifications */
    notifyStaffOnBooking: boolean().notNull().default(true),
    reminder24h: boolean().notNull().default(true),
    reminder2h: boolean().notNull().default(true),
    /** Abonnement (synchronisé depuis Stripe par webhook) */
    plan: text({ enum: ["free", "starter", "pro"] }).notNull().default("free"),
    stripeCustomerId: text().unique(),
    stripeSubscriptionId: text().unique(),
    subscriptionStatus: text(),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    onboardingCompletedAt: timestamp({ withTimezone: true }),
    metadata: text(),
    createdAt: createdAt(),
  },
  (t) => [
    check("organization_slot_interval_ck", sql`${t.slotIntervalMinutes} between 5 and 120`),
    check("organization_min_notice_ck", sql`${t.minNoticeMinutes} between 0 and 43200`),
    check("organization_max_advance_ck", sql`${t.maxAdvanceDays} between 1 and 730`),
  ],
);

export const member = pgTable(
  "member",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text({ enum: ["owner", "admin", "employee"] })
      .notNull()
      .default("employee"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("member_org_user_uq").on(t.organizationId, t.userId),
    index("member_user_id_idx").on(t.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: id(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: text({ enum: ["admin", "employee"] })
      .notNull()
      .default("employee"),
    /** Empreinte SHA-256 du jeton envoyé par email (le jeton lui-même n'est jamais stocké). */
    tokenHash: text().notNull().unique(),
    status: text({ enum: ["pending", "accepted", "declined", "cancelled"] })
      .notNull()
      .default("pending"),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    inviterId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("invitation_org_id_idx").on(t.organizationId),
    index("invitation_email_idx").on(t.email),
    uniqueIndex("invitation_pending_uq")
      .on(t.organizationId, t.email)
      .where(sql`${t.status} = 'pending'`),
  ],
);
