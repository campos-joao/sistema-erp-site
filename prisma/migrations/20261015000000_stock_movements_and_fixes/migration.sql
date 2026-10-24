-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- DropForeignKey
ALTER TABLE "stock_items" DROP CONSTRAINT "stock_items_variation_id_fkey";

-- DropIndex
DROP INDEX "stock_items_location_id_product_id_variation_id_key";

-- Consolida saldos duplicados de produtos sem variação (permitidos pelo índice antigo)
-- antes de criar o índice único parcial.
WITH dup AS (
    SELECT "location_id", "product_id", MIN("id") AS keep_id, SUM("quantity") AS total
    FROM "stock_items"
    WHERE "variation_id" IS NULL
    GROUP BY "location_id", "product_id"
    HAVING COUNT(*) > 1
)
UPDATE "stock_items" s SET "quantity" = dup.total
FROM dup WHERE s."id" = dup.keep_id;

DELETE FROM "stock_items" s
USING (
    SELECT "location_id", "product_id", MIN("id") AS keep_id
    FROM "stock_items"
    WHERE "variation_id" IS NULL
    GROUP BY "location_id", "product_id"
    HAVING COUNT(*) > 1
) dup
WHERE s."variation_id" IS NULL
  AND s."location_id" = dup."location_id"
  AND s."product_id" = dup."product_id"
  AND s."id" <> dup.keep_id;

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variation_id" TEXT,
    "location_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "balance_after" DECIMAL(14,3) NOT NULL,
    "note" TEXT,
    "created_by_id" TEXT,
    "created_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_created_at_idx" ON "stock_movements"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_product_id_idx" ON "stock_movements"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_location_id_idx" ON "stock_movements"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "stock_items_tenant_id_location_id_idx" ON "stock_items"("tenant_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_location_product_no_variation_key" ON "stock_items"("location_id", "product_id") WHERE ("variation_id" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_location_variation_key" ON "stock_items"("location_id", "variation_id") WHERE ("variation_id" IS NOT NULL);

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_variation_id_tenant_id_fkey" FOREIGN KEY ("variation_id", "tenant_id") REFERENCES "product_variations"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_tenant_id_fkey" FOREIGN KEY ("product_id", "tenant_id") REFERENCES "products"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variation_id_tenant_id_fkey" FOREIGN KEY ("variation_id", "tenant_id") REFERENCES "product_variations"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_tenant_id_fkey" FOREIGN KEY ("location_id", "tenant_id") REFERENCES "stock_locations"("id", "tenant_id") ON DELETE CASCADE ON UPDATE CASCADE;

