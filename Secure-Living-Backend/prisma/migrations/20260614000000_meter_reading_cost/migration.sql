-- Meter reading cost calculation: tariff per unit + computed cost + notes
-- AlterTable
ALTER TABLE "UtilityMeter" ADD COLUMN "pricePerUnitKes" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UtilityReading" ADD COLUMN "pricePerUnitKes" DOUBLE PRECISION;
ALTER TABLE "UtilityReading" ADD COLUMN "costKes" DOUBLE PRECISION;
ALTER TABLE "UtilityReading" ADD COLUMN "notes" TEXT;
