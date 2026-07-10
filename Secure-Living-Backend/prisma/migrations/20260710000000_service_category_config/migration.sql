-- Add categoryType (Maintenance / Professional) and flexible config JSON to ServiceCategory
ALTER TABLE "ServiceCategory" ADD COLUMN "categoryType" TEXT NOT NULL DEFAULT 'MAINTENANCE';
ALTER TABLE "ServiceCategory" ADD COLUMN "config" JSONB;

CREATE INDEX "ServiceCategory_categoryType_idx" ON "ServiceCategory"("categoryType");
