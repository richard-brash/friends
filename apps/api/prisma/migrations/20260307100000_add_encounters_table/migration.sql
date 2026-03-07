-- CreateEnum
CREATE TYPE "EncounterType" AS ENUM ('DELIVERY');

-- CreateTable
CREATE TABLE "encounters" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "route_id" UUID,
    "request_id" UUID,
    "location_name" TEXT,
    "type" "EncounterType" NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encounters_person_id_created_at_idx" ON "encounters"("person_id", "created_at");

-- CreateIndex
CREATE INDEX "encounters_route_id_created_at_idx" ON "encounters"("route_id", "created_at");

-- CreateIndex
CREATE INDEX "encounters_request_id_idx" ON "encounters"("request_id");

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
