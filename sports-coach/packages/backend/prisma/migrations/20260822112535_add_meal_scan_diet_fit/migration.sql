/*
  Warnings:

  - Added the required column `adequation_objectif` to the `meal_scans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commentaire_objectif` to the `meal_scans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Valeurs par defaut ajoutees pour ne pas casser un deploiement si la table
-- contient deja des lignes (le defaut n'est utilise que pour les lignes
-- existantes ; le code applicatif fournit toujours ces champs explicitement
-- pour les nouvelles lignes).
ALTER TABLE "meal_scans" ADD COLUMN     "adequation_objectif" TEXT NOT NULL DEFAULT 'a_moderer',
ADD COLUMN     "commentaire_objectif" TEXT NOT NULL DEFAULT '';

ALTER TABLE "meal_scans" ALTER COLUMN "adequation_objectif" DROP DEFAULT;
ALTER TABLE "meal_scans" ALTER COLUMN "commentaire_objectif" DROP DEFAULT;
