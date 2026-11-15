CREATE TABLE "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_appointmentId_unique" UNIQUE("appointment_id"),
	CONSTRAINT "review_rating_ck" CHECK ("review"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "listed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_organization_id_customer_id_customer_organization_id_id_fk" FOREIGN KEY ("organization_id","customer_id") REFERENCES "public"."customer"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_org_status_idx" ON "review" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "organization_directory_idx" ON "organization" USING btree ("activity","postal_code") WHERE "organization"."listed" and "organization"."booking_enabled";--> statement-breakpoint
ALTER TABLE "review" ENABLE ROW LEVEL SECURITY;
