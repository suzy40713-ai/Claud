import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Journal de tous les emails émis par BookSync (outbox).
 * Sert à l'audit, au débogage et, plus tard, aux renvois automatiques.
 */
export const emailMessage = pgTable(
  "email_message",
  {
    id: uuid().primaryKey().defaultRandom(),
    to: text().notNull(),
    subject: text().notNull(),
    template: text().notNull(),
    html: text().notNull(),
    text: text().notNull(),
    /** pending → sent | failed ; `logged` = non envoyé (développement, aucun fournisseur configuré). */
    status: text({ enum: ["pending", "sent", "failed", "logged"] })
      .notNull()
      .default("pending"),
    provider: text(),
    providerMessageId: text(),
    error: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp({ withTimezone: true }),
  },
  (t) => [index("email_message_to_created_idx").on(t.to, t.createdAt)],
);
