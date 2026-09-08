-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'IPOD';
ALTER TYPE "Category" ADD VALUE 'CLASSIC';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "legacy" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserProduct" ADD COLUMN     "pricePaidUSD" INTEGER;

-- CreateIndex
CREATE INDEX "Product_legacy_idx" ON "Product"("legacy");
