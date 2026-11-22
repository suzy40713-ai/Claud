CREATE TABLE "gift_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount_cents" integer NOT NULL,
	"balance_cents" integer NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"recipient_name" text NOT NULL,
	"message" text,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_card_stripeCheckoutSessionId_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "gift_card_org_id_uq" UNIQUE("organization_id","id"),
	CONSTRAINT "gift_card_amount_ck" CHECK ("gift_card"."amount_cents" between 100 and 100000),
	CONSTRAINT "gift_card_balance_ck" CHECK ("gift_card"."balance_cents" between 0 and "gift_card"."amount_cents")
);
--> statement-breakpoint
CREATE TABLE "gift_card_use" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"gift_card_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_card_use_amount_ck" CHECK ("gift_card_use"."amount_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "gift_cards_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "gift_card_amounts" integer[] DEFAULT '{3000,5000,10000}'::integer[] NOT NULL;--> statement-breakpoint
ALTER TABLE "gift_card" ADD CONSTRAINT "gift_card_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_use" ADD CONSTRAINT "gift_card_use_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_use" ADD CONSTRAINT "gift_card_use_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_use" ADD CONSTRAINT "gift_card_use_organization_id_gift_card_id_gift_card_organization_id_id_fk" FOREIGN KEY ("organization_id","gift_card_id") REFERENCES "public"."gift_card"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gift_card_org_code_uq" ON "gift_card" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "gift_card_org_created_idx" ON "gift_card" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "gift_card_use_card_idx" ON "gift_card_use" USING btree ("gift_card_id");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_gift_card_amounts_ck" CHECK (cardinality("gift_card_amounts") between 1 and 6);--> statement-breakpoint
ALTER TABLE "gift_card" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gift_card_use" ENABLE ROW LEVEL SECURITY;
