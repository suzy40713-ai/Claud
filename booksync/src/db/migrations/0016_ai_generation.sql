CREATE TABLE "ai_generation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"product_id" uuid,
	"kind" text NOT NULL,
	"model" text NOT NULL,
	"input_hash" text NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micro_usd" integer DEFAULT 0 NOT NULL,
	"cached" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generation" ADD CONSTRAINT "ai_generation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation" ADD CONSTRAINT "ai_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation" ADD CONSTRAINT "ai_generation_organization_id_product_id_product_organization_id_id_fk" FOREIGN KEY ("organization_id","product_id") REFERENCES "public"."product"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_generation_org_created_idx" ON "ai_generation" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_generation_org_kind_hash_idx" ON "ai_generation" USING btree ("organization_id","kind","input_hash");--> statement-breakpoint
CREATE INDEX "ai_generation_product_idx" ON "ai_generation" USING btree ("product_id","kind","created_at");--> statement-breakpoint
ALTER TABLE "ai_generation" ENABLE ROW LEVEL SECURITY;
