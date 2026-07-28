/*
  Warnings:

  - Added the required column `sport` to the `planned_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "planned_sessions" ADD COLUMN     "sport" "Sport" NOT NULL;
