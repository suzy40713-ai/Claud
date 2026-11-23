CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price_cents" integer,
	"category" text NOT NULL,
	"benefits" text,
	"target_audience" text,
	"url" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_org_id_uq" UNIQUE("organization_id","id"),
	CONSTRAINT "product_price_ck" CHECK ("product"."price_cents" is null or "product"."price_cents" between 0 and 100000000)
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "booking_module" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_org_created_idx" ON "product" USING btree ("organization_id","created_at");--> statement-breakpoint
ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;
