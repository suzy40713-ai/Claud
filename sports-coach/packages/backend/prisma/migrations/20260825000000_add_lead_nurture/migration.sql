-- AlterTable
ALTER TABLE "email_leads" ADD COLUMN "nurture_step" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "email_leads" ADD COLUMN "next_nurture_at" TIMESTAMP(3);

-- Planifie la 1ere relance des leads deja captures avant cette migration,
-- pour qu'ils ne restent pas bloques indefiniment sans jamais la recevoir.
UPDATE "email_leads" SET "next_nurture_at" = "created_at" + INTERVAL '2 days' WHERE "next_nurture_at" IS NULL;
