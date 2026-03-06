/*
  Warnings:

  - You are about to drop the column `org_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `encounters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `friends` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fulfillment_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `needs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('REQUESTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "encounters" DROP CONSTRAINT "encounters_friend_id_fkey";

-- DropForeignKey
ALTER TABLE "encounters" DROP CONSTRAINT "encounters_org_id_fkey";

-- DropForeignKey
ALTER TABLE "encounters" DROP CONSTRAINT "encounters_user_id_fkey";

-- DropForeignKey
ALTER TABLE "friends" DROP CONSTRAINT "friends_org_id_fkey";

-- DropForeignKey
ALTER TABLE "fulfillment_events" DROP CONSTRAINT "fulfillment_events_encounter_id_fkey";

-- DropForeignKey
ALTER TABLE "fulfillment_events" DROP CONSTRAINT "fulfillment_events_need_id_fkey";

-- DropForeignKey
ALTER TABLE "fulfillment_events" DROP CONSTRAINT "fulfillment_events_org_id_fkey";

-- DropForeignKey
ALTER TABLE "needs" DROP CONSTRAINT "needs_friend_id_fkey";

-- DropForeignKey
ALTER TABLE "needs" DROP CONSTRAINT "needs_org_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_org_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "org_id",
DROP COLUMN "password_hash",
DROP COLUMN "role",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "organization_id" UUID NOT NULL;

-- DropTable
DROP TABLE "encounters";

-- DropTable
DROP TABLE "friends";

-- DropTable
DROP TABLE "fulfillment_events";

-- DropTable
DROP TABLE "needs";

-- DropEnum
DROP TYPE "ConsentScope";

-- DropEnum
DROP TYPE "NeedStatus";

-- DropEnum
DROP TYPE "Priority";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "display_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_aliases" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_locations" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "observed_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_locations" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "taken_by_user_id" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_items" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity_requested" INTEGER NOT NULL,
    "quantity_fulfilled" INTEGER NOT NULL DEFAULT 0,
    "quantity_delivered" INTEGER NOT NULL DEFAULT 0,
    "fulfilled_by_user_id" UUID,
    "fulfilled_at" TIMESTAMP(3),
    "delivered_by_user_id" UUID,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "observed_by_user_id" UUID NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "people_organization_id_idx" ON "people"("organization_id");

-- CreateIndex
CREATE INDEX "person_aliases_person_id_idx" ON "person_aliases"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_aliases_person_id_alias_key" ON "person_aliases"("person_id", "alias");

-- CreateIndex
CREATE INDEX "locations_organization_id_idx" ON "locations"("organization_id");

-- CreateIndex
CREATE INDEX "person_locations_person_id_idx" ON "person_locations"("person_id");

-- CreateIndex
CREATE INDEX "person_locations_location_id_idx" ON "person_locations"("location_id");

-- CreateIndex
CREATE INDEX "person_locations_observed_by_user_id_idx" ON "person_locations"("observed_by_user_id");

-- CreateIndex
CREATE INDEX "person_locations_observed_at_idx" ON "person_locations"("observed_at");

-- CreateIndex
CREATE INDEX "routes_organization_id_idx" ON "routes"("organization_id");

-- CreateIndex
CREATE INDEX "route_locations_route_id_idx" ON "route_locations"("route_id");

-- CreateIndex
CREATE INDEX "route_locations_location_id_idx" ON "route_locations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_locations_route_id_stop_order_key" ON "route_locations"("route_id", "stop_order");

-- CreateIndex
CREATE UNIQUE INDEX "route_locations_route_id_location_id_key" ON "route_locations"("route_id", "location_id");

-- CreateIndex
CREATE INDEX "requests_person_id_idx" ON "requests"("person_id");

-- CreateIndex
CREATE INDEX "requests_location_id_idx" ON "requests"("location_id");

-- CreateIndex
CREATE INDEX "requests_location_id_status_idx" ON "requests"("location_id", "status");

-- CreateIndex
CREATE INDEX "requests_taken_by_user_id_idx" ON "requests"("taken_by_user_id");

-- CreateIndex
CREATE INDEX "request_items_request_id_idx" ON "request_items"("request_id");

-- CreateIndex
CREATE INDEX "request_items_fulfilled_by_user_id_idx" ON "request_items"("fulfilled_by_user_id");

-- CreateIndex
CREATE INDEX "request_items_delivered_by_user_id_idx" ON "request_items"("delivered_by_user_id");

-- CreateIndex
CREATE INDEX "observations_person_id_idx" ON "observations"("person_id");

-- CreateIndex
CREATE INDEX "observations_location_id_idx" ON "observations"("location_id");

-- CreateIndex
CREATE INDEX "observations_observed_by_user_id_idx" ON "observations"("observed_by_user_id");

-- CreateIndex
CREATE INDEX "observations_observed_at_idx" ON "observations"("observed_at");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_aliases" ADD CONSTRAINT "person_aliases_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_locations" ADD CONSTRAINT "person_locations_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_locations" ADD CONSTRAINT "person_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_locations" ADD CONSTRAINT "person_locations_observed_by_user_id_fkey" FOREIGN KEY ("observed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_locations" ADD CONSTRAINT "route_locations_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_locations" ADD CONSTRAINT "route_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_taken_by_user_id_fkey" FOREIGN KEY ("taken_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_fulfilled_by_user_id_fkey" FOREIGN KEY ("fulfilled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_delivered_by_user_id_fkey" FOREIGN KEY ("delivered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_observed_by_user_id_fkey" FOREIGN KEY ("observed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
