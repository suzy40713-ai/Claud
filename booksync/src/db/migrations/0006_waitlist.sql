CREATE TABLE "waitlist_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"staff_id" uuid,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"weekdays" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	"from_minute" integer DEFAULT 0 NOT NULL,
	"to_minute" integer DEFAULT 1440 NOT NULL,
	"note" text,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entry_org_id_uq" UNIQUE("organization_id","id"),
	CONSTRAINT "waitlist_entry_dates_ck" CHECK ("waitlist_entry"."date_from" <= "waitlist_entry"."date_to"),
	CONSTRAINT "waitlist_entry_minutes_ck" CHECK ("waitlist_entry"."from_minute" >= 0 and "waitlist_entry"."from_minute" < "waitlist_entry"."to_minute" and "waitlist_entry"."to_minute" <= 1440)
);
--> statement-breakpoint
CREATE TABLE "waitlist_offer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"appointment_id" uuid,
	"notified_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_organization_id_customer_id_customer_organization_id_id_fk" FOREIGN KEY ("organization_id","customer_id") REFERENCES "public"."customer"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_organization_id_service_id_service_organization_id_id_fk" FOREIGN KEY ("organization_id","service_id") REFERENCES "public"."service"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_offer" ADD CONSTRAINT "waitlist_offer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_offer" ADD CONSTRAINT "waitlist_offer_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_offer" ADD CONSTRAINT "waitlist_offer_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_offer" ADD CONSTRAINT "waitlist_offer_organization_id_entry_id_waitlist_entry_organization_id_id_fk" FOREIGN KEY ("organization_id","entry_id") REFERENCES "public"."waitlist_entry"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "waitlist_entry_org_status_idx" ON "waitlist_entry" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_offer_slot_uq" ON "waitlist_offer" USING btree ("entry_id","staff_id","starts_at");--> statement-breakpoint
CREATE INDEX "waitlist_offer_status_idx" ON "waitlist_offer" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "waitlist_offer_slot_idx" ON "waitlist_offer" USING btree ("organization_id","staff_id","starts_at");--> statement-breakpoint
ALTER TABLE "waitlist_entry" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "waitlist_offer" ENABLE ROW LEVEL SECURITY;
