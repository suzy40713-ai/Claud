-- CreateEnum
CREATE TYPE "EbookDeliveryStatus" AS ENUM ('en_attente', 'envoye', 'echec');

-- CreateTable
CREATE TABLE "ebook_purchases" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stripe_session_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "amount_total" INTEGER NOT NULL,
    "delivery_status" "EbookDeliveryStatus" NOT NULL DEFAULT 'en_attente',
    "delivery_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "ebook_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ebook_purchases_stripe_session_id_key" ON "ebook_purchases"("stripe_session_id");
