CREATE TABLE "ai_provider_usage" (
	"provider" text NOT NULL,
	"day" date NOT NULL,
	"calls" integer DEFAULT 0 NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_provider_usage_provider_day_pk" PRIMARY KEY("provider","day")
);
--> statement-breakpoint
ALTER TABLE "ai_provider_usage" ENABLE ROW LEVEL SECURITY;
