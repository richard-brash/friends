-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('OPEN', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED_UNABLE');

-- CreateEnum
CREATE TYPE "FulfillmentEventType" AS ENUM ('CREATED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ATTEMPTED_NOT_FOUND', 'CLOSED_UNABLE');

-- AlterEnum
ALTER TYPE "EncounterType" ADD VALUE 'INTERACTION';

-- AlterTable
ALTER TABLE "request_items"
ADD COLUMN "status" "NeedStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "fulfillment_events" (
    "id" UUID NOT NULL,
    "need_id" UUID NOT NULL,
    "encounter_id" UUID,
    "event_type" "FulfillmentEventType" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_items_status_idx" ON "request_items"("status");

-- CreateIndex
CREATE INDEX "fulfillment_events_need_id_created_at_idx" ON "fulfillment_events"("need_id", "created_at");

-- CreateIndex
CREATE INDEX "fulfillment_events_encounter_id_idx" ON "fulfillment_events"("encounter_id");

-- AddForeignKey
ALTER TABLE "fulfillment_events" ADD CONSTRAINT "fulfillment_events_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "request_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_events" ADD CONSTRAINT "fulfillment_events_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
