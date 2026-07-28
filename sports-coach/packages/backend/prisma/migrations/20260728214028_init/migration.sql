-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('course_a_pied', 'velo');

-- CreateEnum
CREATE TYPE "Niveau" AS ENUM ('debutant', 'intermediaire', 'avance');

-- CreateEnum
CREATE TYPE "Objectif" AS ENUM ('perte_de_poids', 'preparation_course', 'regularite', 'performance');

-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('fit', 'gpx', 'tcx', 'manuel');

-- CreateEnum
CREATE TYPE "SessionStatut" AS ENUM ('a_faire', 'fait', 'ajuste', 'skip');

-- CreateEnum
CREATE TYPE "CoachRole" AS ENUM ('user', 'assistant');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "objectif" "Objectif",
    "sports_pratiques" "Sport"[],
    "niveau" "Niveau",
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "injury_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date_approx" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "injury_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sport" "Sport" NOT NULL,
    "duree" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "denivele" DOUBLE PRECISION,
    "fc_moyenne" INTEGER,
    "allure_moyenne" DOUBLE PRECISION,
    "source_format" "ActivitySource" NOT NULL,
    "source_file" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sommeil" INTEGER NOT NULL,
    "fatigue" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "semaine_debut" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_sessions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "duree_cible" INTEGER NOT NULL,
    "intensite_cible" TEXT NOT NULL,
    "statut" "SessionStatut" NOT NULL DEFAULT 'a_faire',
    "raison_ajustement" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "CoachRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "activities_user_id_date_idx" ON "activities"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_user_id_date_key" ON "daily_logs"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "training_plans_user_id_semaine_debut_key" ON "training_plans"("user_id", "semaine_debut");

-- CreateIndex
CREATE INDEX "planned_sessions_plan_id_date_idx" ON "planned_sessions"("plan_id", "date");

-- CreateIndex
CREATE INDEX "coach_messages_user_id_created_at_idx" ON "coach_messages"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "injury_history" ADD CONSTRAINT "injury_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
