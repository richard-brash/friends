-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "auth_user_id" TEXT,
  ADD COLUMN "phone_number" TEXT,
  ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
