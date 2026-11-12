CREATE TABLE "automation_rule" (
	"organization_id" uuid NOT NULL,
	"key" text NOT NULL,
	"enabled" boolean NOT NULL,
	"updated_by_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "automation_rule_organization_id_key_pk" PRIMARY KEY("organization_id","key")
);
--> statement-breakpoint
CREATE TABLE "autopilot_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"summary" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"actor_user_id" uuid,
	"expires_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_rule" ADD CONSTRAINT "automation_rule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rule" ADD CONSTRAINT "automation_rule_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autopilot_action" ADD CONSTRAINT "autopilot_action_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autopilot_action" ADD CONSTRAINT "autopilot_action_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "autopilot_action_org_created_idx" ON "autopilot_action" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "autopilot_action_org_status_idx" ON "autopilot_action" USING btree ("organization_id","status");--> statement-breakpoint
-- Reprise des réglages de notifications existants dans les règles Autopilot (valeurs non par défaut uniquement).
INSERT INTO "automation_rule" ("organization_id", "key", "enabled")
SELECT "id", 'staff_alerts', false FROM "organization" WHERE "notify_staff_on_booking" = false
UNION ALL SELECT "id", 'reminder_24h', false FROM "organization" WHERE "reminder24h" = false
UNION ALL SELECT "id", 'reminder_2h', false FROM "organization" WHERE "reminder2h" = false;--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "notify_staff_on_booking";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "reminder24h";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "reminder2h";--> statement-breakpoint
ALTER TABLE "automation_rule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "autopilot_action" ENABLE ROW LEVEL SECURITY;