CREATE TABLE "marketing_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_plan_org_id_uq" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "marketing_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"day" smallint NOT NULL,
	"position" smallint NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"channel" text NOT NULL,
	"done_at" timestamp with time zone,
	CONSTRAINT "marketing_task_plan_day_pos_uq" UNIQUE("plan_id","day","position"),
	CONSTRAINT "marketing_task_day_ck" CHECK ("marketing_task"."day" between 1 and 30)
);
--> statement-breakpoint
ALTER TABLE "marketing_plan" ADD CONSTRAINT "marketing_plan_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_plan" ADD CONSTRAINT "marketing_plan_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_plan" ADD CONSTRAINT "marketing_plan_organization_id_product_id_product_organization_id_id_fk" FOREIGN KEY ("organization_id","product_id") REFERENCES "public"."product"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_task" ADD CONSTRAINT "marketing_task_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_task" ADD CONSTRAINT "marketing_task_organization_id_plan_id_marketing_plan_organization_id_id_fk" FOREIGN KEY ("organization_id","plan_id") REFERENCES "public"."marketing_plan"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_plan_one_active_uq" ON "marketing_plan" USING btree ("organization_id") WHERE "marketing_plan"."active";--> statement-breakpoint
ALTER TABLE "marketing_plan" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marketing_task" ENABLE ROW LEVEL SECURITY;
