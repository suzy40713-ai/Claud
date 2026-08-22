-- CreateEnum
CREATE TYPE "ChallengeStatut" AS ENUM ('reussi', 'echoue', 'manque');

-- CreateTable
CREATE TABLE "rank_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rang" INTEGER NOT NULL DEFAULT 0,
    "derniere_semaine_resolue" DATE,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rank_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pushup_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "semaine_debut" DATE NOT NULL,
    "statut" "ChallengeStatut" NOT NULL,
    "reps_detectees" INTEGER NOT NULL,
    "forme_valide" BOOLEAN NOT NULL,
    "commentaire" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pushup_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rank_profiles_user_id_key" ON "rank_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pushup_challenges_user_id_semaine_debut_key" ON "pushup_challenges"("user_id", "semaine_debut");

-- AddForeignKey
ALTER TABLE "rank_profiles" ADD CONSTRAINT "rank_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pushup_challenges" ADD CONSTRAINT "pushup_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
