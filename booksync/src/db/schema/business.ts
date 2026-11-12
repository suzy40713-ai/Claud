/**
 * Données métier BookSync. Chaque table porte `organization_id`.
 * Les clés étrangères composites (organization_id, id) garantissent EN BASE qu'un rendez-vous,
 * un service, un employé et un client appartiennent toujours à la même entreprise.
 */
import { sql } from "drizzle-orm";
import {
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
    status: text({ enum: ["confirmed", "cancelled", "completed", "no_show"] })
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
 * Journal Autopilot : chaque action automatique ou demandée (assistant, liste d'attente, réglages),
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
