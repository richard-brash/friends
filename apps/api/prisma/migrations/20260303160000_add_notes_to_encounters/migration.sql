-- AlterTable
ALTER TABLE "encounters" ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "encounters_org_id_friend_id_idx" ON "encounters"("org_id", "friend_id");