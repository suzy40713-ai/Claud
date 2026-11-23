CREATE TABLE "marketing_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid,
	"date" date NOT NULL,
	"channel" text NOT NULL,
	"spend_cents" integer DEFAULT 0 NOT NULL,
	"impressions" integer,
	"clicks" integer,
	"sales" integer,
	"revenue_cents" integer,
	"note" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_result_values_ck" CHECK ("marketing_result"."spend_cents" between 0 and 100000000 and coalesce("marketing_result"."impressions", 0) between 0 and 1000000000 and coalesce("marketing_result"."clicks", 0) between 0 and 1000000000 and coalesce("marketing_result"."sales", 0) between 0 and 10000000 and coalesce("marketing_result"."revenue_cents", 0) between 0 and 1000000000)
);
--> statement-breakpoint
ALTER TABLE "marketing_result" ADD CONSTRAINT "marketing_result_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_result" ADD CONSTRAINT "marketing_result_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_result" ADD CONSTRAINT "marketing_result_organization_id_product_id_product_organization_id_id_fk" FOREIGN KEY ("organization_id","product_id") REFERENCES "public"."product"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketing_result_org_date_idx" ON "marketing_result" USING btree ("organization_id","date");--> statement-breakpoint
ALTER TABLE "marketing_result" ENABLE ROW LEVEL SECURITY;
