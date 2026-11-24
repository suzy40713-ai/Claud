/**
 * Données métier BookSync. Chaque table porte `organization_id`.
 * Les clés étrangères composites (organization_id, id) garantissent EN BASE qu'un rendez-vous,
 * un service, un employé et un client appartiennent toujours à la même entreprise.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { member, organization, user } from "./auth";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const orgId = () =>
  uuid()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });

/** Images (logo, photos, visuels) optimisées en WebP et servies par /api/fichiers/{id}. */
export const file = pgTable("file", {
  id: uuid().primaryKey().defaultRandom(),
  organizationId: orgId(),
  kind: text({ enum: ["logo", "cover", "staff_photo", "service_image"] }).notNull(),
  contentType: text().notNull(),
  byteSize: integer().notNull(),
  width: integer(),
  height: integer(),
  data: bytea().notNull(),
  createdAt: createdAt(),
});

/** Profil de réservation d'un membre de l'équipe (1 par membre). */
export const staff = pgTable(
  "staff",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    /** Nul si le membre a quitté l'équipe : le profil est conservé (inactif) pour l'historique. */
    memberId: uuid()
      .unique()
      .references(() => member.id, { onDelete: "set null" }),
    displayName: text().notNull(),
    photoFileId: uuid().references(() => file.id, { onDelete: "set null" }),
    bio: text(),
    color: text().notNull().default("#3563E9"),
    /** Apparaît sur la page de réservation et peut recevoir des rendez-vous. */
    isBookable: boolean().notNull().default(true),
    /** Désactivé (ex. dépassement de forfait) : données conservées, plus de réservation. */
    isActive: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("staff_org_id_uq").on(t.organizationId, t.id)],
);

export const service = pgTable(
  "service",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    name: text().notNull(),
    description: text(),
    durationMinutes: integer().notNull(),
    priceCents: integer().notNull().default(0),
    /** Temps de préparation / nettoyage après la prestation (non visible par le client). */
    bufferAfterMinutes: integer().notNull().default(0),
    imageFileId: uuid().references(() => file.id, { onDelete: "set null" }),
    color: text().notNull().default("#3563E9"),
    isActive: boolean().notNull().default(true),
    /** Visible et réservable sur la page publique. */
    isOnlineBookable: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    deletedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("service_org_id_uq").on(t.organizationId, t.id),
    index("service_org_idx").on(t.organizationId),
    check("service_duration_ck", sql`${t.durationMinutes} between 5 and 720`),
    check("service_price_ck", sql`${t.priceCents} between 0 and 10000000`),
    check("service_buffer_ck", sql`${t.bufferAfterMinutes} between 0 and 240`),
  ],
);

export const staffService = pgTable(
  "staff_service",
  {
    organizationId: orgId(),
    staffId: uuid().notNull(),
    serviceId: uuid().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.staffId, t.serviceId] }),
    foreignKey({
      columns: [t.organizationId, t.staffId],
      foreignColumns: [staff.organizationId, staff.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.organizationId, t.serviceId],
      foreignColumns: [service.organizationId, service.id],
    }).onDelete("cascade"),
    index("staff_service_service_idx").on(t.serviceId),
  ],
);

/**
 * Plages horaires hebdomadaires en heure locale de l'entreprise.
 * `staff_id` nul = horaires d'ouverture de l'entreprise. Plusieurs plages par jour = pauses entre elles.
 * weekday : 1 = lundi … 7 = dimanche (ISO 8601). Minutes depuis minuit.
 */
export const workingHours = pgTable(
  "working_hours",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    staffId: uuid(),
    weekday: smallint().notNull(),
    startMinute: smallint().notNull(),
    endMinute: smallint().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.staffId],
      foreignColumns: [staff.organizationId, staff.id],
    }).onDelete("cascade"),
    index("working_hours_org_staff_idx").on(t.organizationId, t.staffId),
    check("working_hours_weekday_ck", sql`${t.weekday} between 1 and 7`),
    check(
      "working_hours_range_ck",
      sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.startMinute} < ${t.endMinute}`,
    ),
  ],
);

/** Absences : jours de repos / congés d'un employé, ou fermeture de l'entreprise (staff_id nul). */
export const timeOff = pgTable(
  "time_off",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    staffId: uuid(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    reason: text(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.staffId],
      foreignColumns: [staff.organizationId, staff.id],
    }).onDelete("cascade"),
    index("time_off_org_range_idx").on(t.organizationId, t.startsAt, t.endsAt),
    check("time_off_range_ck", sql`${t.startsAt} < ${t.endsAt}`),
  ],
);

export const customer = pgTable(
  "customer",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text(),
    phone: text(),
    /** Notes internes, jamais visibles par le client. Ne pas y saisir de données de santé. */
    notes: text(),
    /** Consentement à recevoir les emails de rendez-vous (confirmation, rappels). */
    emailOptIn: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("customer_org_id_uq").on(t.organizationId, t.id),
    uniqueIndex("customer_org_email_uq")
      .on(t.organizationId, sql`lower(${t.email})`)
      .where(sql`${t.email} is not null`),
    index("customer_org_name_idx").on(t.organizationId, t.lastName, t.firstName),
  ],
);

/**
 * Rendez-vous. La contrainte d'exclusion (migration SQL) interdit deux rendez-vous actifs
 * qui se chevauchent pour un même employé : [starts_at, blocked_until) inclut le temps tampon.
 */
export const appointment = pgTable(
  "appointment",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    staffId: uuid().notNull(),
    serviceId: uuid(),
    customerId: uuid().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    blockedUntil: timestamp({ withTimezone: true }).notNull(),
    /** `pending_payment` : créneau bloqué le temps du paiement de l'acompte (`paymentExpiresAt`). */
    status: text({ enum: ["pending_payment", "confirmed", "cancelled", "completed", "no_show"] })
      .notNull()
      .default("confirmed"),
    source: text({ enum: ["online", "manual"] }).notNull(),
    /** Instantané au moment de la réservation (le service peut changer ensuite). */
    serviceName: text().notNull(),
    priceCents: integer().notNull().default(0),
    customerNote: text(),
    internalNote: text(),
    /** Empreinte du jeton du lien « gérer mon rendez-vous » envoyé au client. */
    manageTokenHash: text().unique(),
    cancelledAt: timestamp({ withTimezone: true }),
    cancelledBy: text({ enum: ["customer", "staff"] }),
    cancellationReason: text(),
    /** Acompte payé en ligne sur le compte Stripe du professionnel. */
    depositCents: integer().notNull().default(0),
    depositStatus: text({ enum: ["none", "pending", "paid", "refunded", "refund_failed"] })
      .notNull()
      .default("none"),
    paymentExpiresAt: timestamp({ withTimezone: true }),
    stripeCheckoutSessionId: text().unique(),
    stripePaymentIntentId: text(),
    createdByUserId: uuid().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.staffId],
      foreignColumns: [staff.organizationId, staff.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.organizationId, t.serviceId],
      foreignColumns: [service.organizationId, service.id],
    }),
    foreignKey({
      columns: [t.organizationId, t.customerId],
      foreignColumns: [customer.organizationId, customer.id],
    }).onDelete("cascade"),
    index("appointment_org_starts_idx").on(t.organizationId, t.startsAt),
    index("appointment_staff_starts_idx").on(t.staffId, t.startsAt),
    index("appointment_customer_idx").on(t.customerId),
    index("appointment_pending_payment_idx")
      .on(t.paymentExpiresAt)
      .where(sql`${t.status} = 'pending_payment'`),
    check(
      "appointment_range_ck",
      sql`${t.startsAt} < ${t.endsAt} and ${t.endsAt} <= ${t.blockedUntil}`,
    ),
  ],
);

/** Compteurs d'usage mensuels (période AAAA-MM dans le fuseau de l'entreprise) : remis à zéro de fait chaque mois. */
export const usageCounter = pgTable(
  "usage_counter",
  {
    organizationId: orgId(),
    period: text().notNull(),
    bookings: integer().notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.period] })],
);

/**
 * File des notifications (email aujourd'hui, SMS demain).
 * `dedupe_key` unique : une même notification ne peut jamais être créée deux fois.
 */
export const notification = pgTable(
  "notification",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    appointmentId: uuid().references(() => appointment.id, { onDelete: "cascade" }),
    channel: text({ enum: ["email", "sms", "in_app"] })
      .notNull()
      .default("email"),
    type: text({
      enum: [
        "booking_confirmation",
        "booking_rescheduled",
        "booking_cancelled",
        "reminder_24h",
        "reminder_2h",
        "staff_new_booking",
        "staff_booking_cancelled",
        "staff_booking_rescheduled",
        "review_request",
      ],
    }).notNull(),
    audience: text({ enum: ["customer", "staff"] }).notNull(),
    recipient: text().notNull(),
    dedupeKey: text().notNull().unique(),
    scheduledFor: timestamp({ withTimezone: true }).notNull().defaultNow(),
    status: text({ enum: ["pending", "processing", "sent", "failed", "skipped", "cancelled"] })
      .notNull()
      .default("pending"),
    attempts: integer().notNull().default(0),
    lastError: text(),
    emailMessageId: uuid(),
    sentAt: timestamp({ withTimezone: true }),
    readAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("notification_due_idx").on(t.status, t.scheduledFor),
    index("notification_org_created_idx").on(t.organizationId, t.createdAt),
  ],
);

/** Factures Stripe (copie synchronisée par webhook pour l'historique des paiements). */
export const invoice = pgTable(
  "invoice",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    stripeInvoiceId: text().notNull().unique(),
    number: text(),
    status: text().notNull(),
    amountDueCents: integer().notNull(),
    amountPaidCents: integer().notNull(),
    currency: text().notNull(),
    hostedInvoiceUrl: text(),
    invoicePdfUrl: text(),
    periodStart: timestamp({ withTimezone: true }),
    periodEnd: timestamp({ withTimezone: true }),
    issuedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [index("invoice_org_issued_idx").on(t.organizationId, t.issuedAt)],
);

/** Événements Stripe déjà traités (idempotence des webhooks). */
export const stripeEvent = pgTable("stripe_event", {
  id: text().primaryKey(),
  type: text().notNull(),
  processedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * Réglages techniques de l'application (ex. secret du webhook Stripe créé automatiquement).
 * Lisibles uniquement côté serveur (RLS activée, aucun accès public).
 */
export const appSetting = pgTable("app_setting", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Choix du professionnel pour chaque automatisation Autopilot (absence de ligne = valeur par défaut).
 * Le catalogue et les forfaits sont définis dans `src/domain/autopilot/automations.ts`.
 */
export const automationRule = pgTable(
  "automation_rule",
  {
    organizationId: orgId(),
    key: text().notNull(),
    enabled: boolean().notNull(),
    updatedByUserId: uuid().references(() => user.id, { onDelete: "set null" }),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.key] })],
);

/**
 * Journal Autopilot : chaque action automatique ou demandée (liste d'attente, réglages),
 * avec son statut. Les actions sensibles restent « pending » tant qu'un humain ne les a pas confirmées.
 */
export const autopilotAction = pgTable(
  "autopilot_action",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    source: text({ enum: ["automation", "assistant", "waitlist", "user"] }).notNull(),
    kind: text().notNull(),
    status: text({ enum: ["pending", "done", "failed", "expired", "cancelled"] }).notNull(),
    summary: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    error: text(),
    actorUserId: uuid().references(() => user.id, { onDelete: "set null" }),
    expiresAt: timestamp({ withTimezone: true }),
    decidedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("autopilot_action_org_created_idx").on(t.organizationId, t.createdAt),
    index("autopilot_action_org_status_idx").on(t.organizationId, t.status),
  ],
);

/**
 * Liste d'attente : un client souhaite un créneau pour une prestation, avec ses préférences.
 * Quand un rendez-vous est annulé, BookSync propose le créneau libéré aux inscrits compatibles.
 */
export const waitlistEntry = pgTable(
  "waitlist_entry",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    customerId: uuid().notNull(),
    serviceId: uuid().notNull(),
    /** null = n'importe quel employé */
    staffId: uuid().references(() => staff.id, { onDelete: "set null" }),
    dateFrom: date({ mode: "string" }).notNull(),
    dateTo: date({ mode: "string" }).notNull(),
    /** 1 = lundi … 7 = dimanche ; vide = tous les jours */
    weekdays: smallint()
      .array()
      .notNull()
      .default(sql`'{}'::smallint[]`),
    fromMinute: integer().notNull().default(0),
    toMinute: integer().notNull().default(1440),
    note: text(),
    status: text({ enum: ["active", "booked", "cancelled", "expired"] })
      .notNull()
      .default("active"),
    source: text({ enum: ["staff", "online"] }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("waitlist_entry_org_id_uq").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId, t.customerId],
      foreignColumns: [customer.organizationId, customer.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.organizationId, t.serviceId],
      foreignColumns: [service.organizationId, service.id],
    }).onDelete("cascade"),
    index("waitlist_entry_org_status_idx").on(t.organizationId, t.status),
    check("waitlist_entry_dates_ck", sql`${t.dateFrom} <= ${t.dateTo}`),
    check(
      "waitlist_entry_minutes_ck",
      sql`${t.fromMinute} >= 0 and ${t.fromMinute} < ${t.toMinute} and ${t.toMinute} <= 1440`,
    ),
  ],
);

/**
 * Proposition d'un créneau libéré à un inscrit. Plusieurs clients peuvent recevoir la même
 * proposition : le premier qui confirme obtient le rendez-vous (la contrainte anti-chevauchement
 * des rendez-vous garantit qu'il n'y a jamais deux gagnants).
 */
export const waitlistOffer = pgTable(
  "waitlist_offer",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    entryId: uuid().notNull(),
    staffId: uuid()
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    status: text({ enum: ["pending", "accepted", "expired", "superseded"] })
      .notNull()
      .default("pending"),
    appointmentId: uuid().references(() => appointment.id, { onDelete: "set null" }),
    notifiedAt: timestamp({ withTimezone: true }),
    attempts: integer().notNull().default(0),
    lastError: text(),
    decidedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.entryId],
      foreignColumns: [waitlistEntry.organizationId, waitlistEntry.id],
    }).onDelete("cascade"),
    uniqueIndex("waitlist_offer_slot_uq").on(t.entryId, t.staffId, t.startsAt),
    index("waitlist_offer_status_idx").on(t.status, t.expiresAt),
    index("waitlist_offer_slot_idx").on(t.organizationId, t.staffId, t.startsAt),
  ],
);

/** Résumés quotidiens envoyés (une ligne par entreprise et par jour : jamais de doublon). */
export const dailySummary = pgTable(
  "daily_summary",
  {
    organizationId: orgId(),
    /** Jour concerné par le résumé (le lendemain de l'envoi), date locale */
    forDate: date({ mode: "string" }).notNull(),
    recipients: integer().notNull().default(0),
    sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.forDate] })],
);

/**
 * Avis clients vérifiés (structure prévue, pas encore exposée) : un avis n'est possible que pour un
 * rendez-vous réellement honoré, une seule fois. Aucun avis ne peut exister sans rendez-vous réel.
 */
export const review = pgTable(
  "review",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    appointmentId: uuid()
      .notNull()
      .unique()
      .references(() => appointment.id, { onDelete: "cascade" }),
    customerId: uuid().notNull(),
    rating: smallint().notNull(),
    comment: text(),
    status: text({ enum: ["pending", "published", "hidden"] })
      .notNull()
      .default("pending"),
    /** Réponse publique du professionnel. */
    reply: text(),
    repliedAt: timestamp({ withTimezone: true }),
    /** Motif obligatoire du masquage (propos injurieux, hors sujet…), conservé pour transparence. */
    hiddenReason: text(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.customerId],
      foreignColumns: [customer.organizationId, customer.id],
    }).onDelete("cascade"),
    index("review_org_status_idx").on(t.organizationId, t.status),
    check("review_rating_ck", sql`${t.rating} between 1 and 5`),
  ],
);

/** Conversation avec l'assistant BookSync (par utilisateur et par entreprise). */
export const assistantMessage = pgTable(
  "assistant_message",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text({ enum: ["user", "assistant"] }).notNull(),
    content: text().notNull(),
    /** Actions proposées (identifiants d'actions Autopilot en attente de confirmation) */
    actionIds: uuid()
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    createdAt: createdAt(),
  },
  (t) => [index("assistant_message_org_user_idx").on(t.organizationId, t.userId, t.createdAt)],
);

/**
 * Consommation de l'assistant par entreprise et par mois : nombre de questions, jetons et coût
 * réel (calculé à partir de l'usage renvoyé par l'API), en millionièmes de dollar.
 */
export const assistantUsage = pgTable(
  "assistant_usage",
  {
    organizationId: orgId(),
    month: text().notNull(),
    questions: integer().notNull().default(0),
    inputTokens: bigint({ mode: "number" }).notNull().default(0),
    outputTokens: bigint({ mode: "number" }).notNull().default(0),
    costMicroUsd: bigint({ mode: "number" }).notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.month] })],
);

/**
 * Carte cadeau vendue en ligne par un établissement. Payée sur le compte Stripe du professionnel
 * (paiement direct) : `pending` jusqu'à confirmation du paiement, puis `active`. Le solde baisse à
 * chaque utilisation au salon (historique dans `gift_card_use`).
 */
export const giftCard = pgTable(
  "gift_card",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    code: text().notNull(),
    status: text({ enum: ["pending", "active"] })
      .notNull()
      .default("pending"),
    amountCents: integer().notNull(),
    balanceCents: integer().notNull(),
    buyerName: text().notNull(),
    buyerEmail: text().notNull(),
    recipientName: text().notNull(),
    message: text(),
    stripeCheckoutSessionId: text().unique(),
    stripePaymentIntentId: text(),
    paidAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("gift_card_org_id_uq").on(t.organizationId, t.id),
    uniqueIndex("gift_card_org_code_uq").on(t.organizationId, t.code),
    index("gift_card_org_created_idx").on(t.organizationId, t.createdAt),
    check("gift_card_amount_ck", sql`${t.amountCents} between 100 and 100000`),
    check("gift_card_balance_ck", sql`${t.balanceCents} between 0 and ${t.amountCents}`),
  ],
);

/** Utilisation d'une carte cadeau au salon (journal non modifiable : qui, quand, combien). */
export const giftCardUse = pgTable(
  "gift_card_use",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    giftCardId: uuid().notNull(),
    amountCents: integer().notNull(),
    userId: uuid().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.giftCardId],
      foreignColumns: [giftCard.organizationId, giftCard.id],
    }).onDelete("cascade"),
    index("gift_card_use_card_idx").on(t.giftCardId),
    check("gift_card_use_amount_ck", sql`${t.amountCents} > 0`),
  ],
);

/** Produit ou service suivi par le copilote marketing (base de toutes les analyses). */
export const product = pgTable(
  "product",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    name: text().notNull(),
    description: text().notNull(),
    /** Prix TTC en centimes ; null = prix non communiqué (devis, variable…). */
    priceCents: integer(),
    category: text({
      enum: ["physique", "numerique", "service", "formation", "abonnement", "autre"],
    }).notNull(),
    benefits: text(),
    targetAudience: text(),
    url: text(),
    createdByUserId: uuid().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("product_org_id_uq").on(t.organizationId, t.id),
    index("product_org_created_idx").on(t.organizationId, t.createdAt),
    check(
      "product_price_ck",
      sql`${t.priceCents} is null or ${t.priceCents} between 0 and 100000000`,
    ),
  ],
);

/**
 * Résultat du copilote marketing (analyse, stratégie, publicité, contenu…) : historique,
 * coût réel et cache (même demande = même empreinte, réponse réutilisée sans nouvel appel).
 */
export const aiGeneration = pgTable(
  "ai_generation",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    userId: uuid().references(() => user.id, { onDelete: "set null" }),
    productId: uuid(),
    kind: text().notNull(),
    model: text().notNull(),
    inputHash: text().notNull(),
    input: jsonb().notNull(),
    output: jsonb().notNull(),
    inputTokens: integer().notNull().default(0),
    outputTokens: integer().notNull().default(0),
    costMicroUsd: integer().notNull().default(0),
    /** Réponse servie depuis le cache (aucun appel, aucun coût, hors quota). */
    cached: boolean().notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.productId],
      foreignColumns: [product.organizationId, product.id],
    }).onDelete("cascade"),
    index("ai_generation_org_created_idx").on(t.organizationId, t.createdAt),
    index("ai_generation_org_kind_hash_idx").on(t.organizationId, t.kind, t.inputHash),
    index("ai_generation_product_idx").on(t.productId, t.kind, t.createdAt),
  ],
);

/** Autopilot marketing : un plan de 30 jours lancé à partir d'une stratégie générée. */
export const marketingPlan = pgTable(
  "marketing_plan",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    productId: uuid().notNull(),
    /** Génération « strategy » d'origine (même entreprise, vérifié à la création). */
    strategyId: uuid().notNull(),
    /** Jour 1 du plan (date locale de l'entreprise). */
    startDate: date({ mode: "string" }).notNull(),
    active: boolean().notNull().default(true),
    createdByUserId: uuid().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("marketing_plan_org_id_uq").on(t.organizationId, t.id),
    foreignKey({
      columns: [t.organizationId, t.productId],
      foreignColumns: [product.organizationId, product.id],
    }).onDelete("cascade"),
    // Un seul plan actif par entreprise.
    uniqueIndex("marketing_plan_one_active_uq")
      .on(t.organizationId)
      .where(sql`${t.active}`),
  ],
);

export const marketingTask = pgTable(
  "marketing_task",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    planId: uuid().notNull(),
    day: smallint().notNull(),
    position: smallint().notNull(),
    title: text().notNull(),
    detail: text().notNull(),
    channel: text().notNull(),
    doneAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.planId],
      foreignColumns: [marketingPlan.organizationId, marketingPlan.id],
    }).onDelete("cascade"),
    unique("marketing_task_plan_day_pos_uq").on(t.planId, t.day, t.position),
    check("marketing_task_day_ck", sql`${t.day} between 1 and 30`),
  ],
);

/** Résultats marketing déclarés par l'entreprise (dépense, clics, ventes…). Jamais estimés. */
export const marketingResult = pgTable(
  "marketing_result",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: orgId(),
    productId: uuid(),
    date: date({ mode: "string" }).notNull(),
    channel: text().notNull(),
    spendCents: integer().notNull().default(0),
    impressions: integer(),
    clicks: integer(),
    sales: integer(),
    revenueCents: integer(),
    note: text(),
    createdByUserId: uuid().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.organizationId, t.productId],
      foreignColumns: [product.organizationId, product.id],
    }).onDelete("cascade"),
    index("marketing_result_org_date_idx").on(t.organizationId, t.date),
    check(
      "marketing_result_values_ck",
      sql`${t.spendCents} between 0 and 100000000 and coalesce(${t.impressions}, 0) between 0 and 1000000000 and coalesce(${t.clicks}, 0) between 0 and 1000000000 and coalesce(${t.sales}, 0) between 0 and 10000000 and coalesce(${t.revenueCents}, 0) between 0 and 1000000000`,
    ),
  ],
);
