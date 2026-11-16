ALTER TABLE "organization" ADD COLUMN "deposit_mode" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "deposit_value" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "stripe_account_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "deposit_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "deposit_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "payment_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "reply" text;--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "replied_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "hidden_reason" text;--> statement-breakpoint
CREATE INDEX "appointment_pending_payment_idx" ON "appointment" USING btree ("payment_expires_at") WHERE "appointment"."status" = 'pending_payment';--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_stripeAccountId_unique" UNIQUE("stripe_account_id");--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_stripeCheckoutSessionId_unique" UNIQUE("stripe_checkout_session_id");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_deposit_value_ck" CHECK ("organization"."deposit_value" between 0 and 1000000);--> statement-breakpoint
-- Un rendez-vous en attente de paiement de l'acompte bloque aussi le créneau (pas de double réservation).
ALTER TABLE "appointment" DROP CONSTRAINT "appointment_no_overlap";--> statement-breakpoint
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "staff_id" WITH =,
    tstzrange("starts_at", "blocked_until", '[)') WITH &&
  ) WHERE ("status" IN ('pending_payment', 'confirmed', 'completed', 'no_show'));--> statement-breakpoint
CREATE INDEX "review_org_published_idx" ON "review" ("organization_id", "created_at" DESC) WHERE "status" = 'published';
