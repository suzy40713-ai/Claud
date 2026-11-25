CREATE TABLE "blog_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"keyword" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" jsonb NOT NULL,
	"model" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_post_slug_unique" UNIQUE("slug"),
	CONSTRAINT "blog_post_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
CREATE INDEX "blog_post_published_idx" ON "blog_post" USING btree ("published_at");--> statement-breakpoint
ALTER TABLE "blog_post" ENABLE ROW LEVEL SECURITY;
