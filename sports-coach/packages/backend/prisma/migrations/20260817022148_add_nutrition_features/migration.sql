-- CreateTable
CREATE TABLE "grocery_lists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grocery_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_scans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteines_g" INTEGER NOT NULL,
    "glucides_g" INTEGER NOT NULL,
    "lipides_g" INTEGER NOT NULL,
    "confiance" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grocery_lists_user_id_created_at_idx" ON "grocery_lists"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "meal_scans_user_id_created_at_idx" ON "meal_scans"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "grocery_lists" ADD CONSTRAINT "grocery_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_scans" ADD CONSTRAINT "meal_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
