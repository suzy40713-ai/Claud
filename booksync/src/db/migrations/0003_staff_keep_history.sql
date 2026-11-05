ALTER TABLE "staff" DROP CONSTRAINT "staff_member_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "staff" ALTER COLUMN "member_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;