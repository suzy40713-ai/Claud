-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'RESEARCHING', 'WRITING_SCRIPT', 'BUILDING_SCENES', 'GENERATING_VOICE', 'GENERATING_SUBTITLES', 'RENDERING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "VideoStyle" AS ENUM ('SURVIE', 'SCIENCE', 'ASTUCE', 'INSOLITE');

-- CreateEnum
CREATE TYPE "VoiceGender" AS ENUM ('HOMME', 'FEMME');

-- CreateEnum
CREATE TYPE "SuspenseLevel" AS ENUM ('FAIBLE', 'MOYEN', 'FORT');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "style" "VideoStyle" NOT NULL,
    "voiceGender" "VoiceGender" NOT NULL,
    "suspenseLevel" "SuspenseLevel" NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "title" TEXT,
    "hook" TEXT,
    "script" JSONB,
    "scenes" JSONB,
    "sources" JSONB,
    "hashtags" JSONB,
    "videoPath" TEXT,
    "thumbnailPath" TEXT,
    "srtPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");
