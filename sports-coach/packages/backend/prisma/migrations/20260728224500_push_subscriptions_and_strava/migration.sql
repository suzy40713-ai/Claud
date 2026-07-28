-- AlterEnum
ALTER TYPE "ActivitySource" ADD VALUE 'strava';

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "strava_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_acwr_alert_at" TIMESTAMP(3),
ADD COLUMN     "strava_access_token" TEXT,
ADD COLUMN     "strava_athlete_id" TEXT,
ADD COLUMN     "strava_last_sync_at" TIMESTAMP(3),
ADD COLUMN     "strava_refresh_token" TEXT,
ADD COLUMN     "strava_token_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "activities_strava_id_key" ON "activities"("strava_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_strava_athlete_id_key" ON "users"("strava_athlete_id");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

