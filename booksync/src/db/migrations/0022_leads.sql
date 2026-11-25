CREATE TABLE "email_optout" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"idea_id" text,
	"source" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"step" integer DEFAULT 0 NOT NULL,
	"next_send_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_nudge" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_nudge_user_id_kind_pk" PRIMARY KEY("user_id","kind")
);
--> statement-breakpoint
ALTER TABLE "user_nudge" ADD CONSTRAINT "user_nudge_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_next_send_idx" ON "lead" USING btree ("next_send_at");--> statement-breakpoint
ALTER TABLE "lead" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_optout" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_nudge" ENABLE ROW LEVEL SECURITY;
