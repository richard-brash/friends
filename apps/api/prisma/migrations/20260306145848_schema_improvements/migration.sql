/*
  Warnings:

  - You are about to drop the column `delivered_at` on the `request_items` table. All the data in the column will be lost.
  - You are about to drop the column `delivered_by_user_id` on the `request_items` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DeliveryOutcome" AS ENUM ('DELIVERED', 'PERSON_NOT_FOUND', 'DECLINED', 'LOCATION_EMPTY');

-- DropForeignKey
ALTER TABLE "request_items" DROP CONSTRAINT "request_items_delivered_by_user_id_fkey";

-- DropIndex
DROP INDEX "request_items_delivered_by_user_id_idx";

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ADD COLUMN     "normalized_name" TEXT;

-- AlterTable
ALTER TABLE "request_items" DROP COLUMN "delivered_at",
DROP COLUMN "delivered_by_user_id";

-- CreateTable
CREATE TABLE "delivery_attempts" (
    "id" UUID NOT NULL,
    "request_item_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL,
    "outcome" "DeliveryOutcome" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_attempts_request_item_id_idx" ON "delivery_attempts"("request_item_id");

-- CreateIndex
CREATE INDEX "delivery_attempts_user_id_idx" ON "delivery_attempts"("user_id");

-- CreateIndex
CREATE INDEX "delivery_attempts_attempted_at_idx" ON "delivery_attempts"("attempted_at");

-- CreateIndex
CREATE INDEX "people_normalized_name_idx" ON "people"("normalized_name");

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_request_item_id_fkey" FOREIGN KEY ("request_item_id") REFERENCES "request_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
