-- CreateTable
CREATE TABLE "bundle_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_session_id" TEXT NOT NULL,
    "amount_total" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_purchases_stripe_session_id_key" ON "bundle_purchases"("stripe_session_id");

-- AddForeignKey
ALTER TABLE "bundle_purchases" ADD CONSTRAINT "bundle_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
