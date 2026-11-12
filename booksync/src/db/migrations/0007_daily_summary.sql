CREATE TABLE "daily_summary" (
	"organization_id" uuid NOT NULL,
	"for_date" date NOT NULL,
	"recipients" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_summary_organization_id_for_date_pk" PRIMARY KEY("organization_id","for_date")
);
--> statement-breakpoint
ALTER TABLE "daily_summary" ADD CONSTRAINT "daily_summary_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_summary" ENABLE ROW LEVEL SECURITY;
