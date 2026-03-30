-- CreateTable
CREATE TABLE "quick_pick_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_pick_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quick_pick_items_organization_id_label_key" ON "quick_pick_items"("organization_id", "label");

-- CreateIndex
CREATE INDEX "quick_pick_items_organization_id_sort_order_idx" ON "quick_pick_items"("organization_id", "sort_order");

-- AddForeignKey
ALTER TABLE "quick_pick_items" ADD CONSTRAINT "quick_pick_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
