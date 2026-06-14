-- Inspection Checklist + Deposit Deduction Engine

-- Enum: add INSPECTION checklist type
ALTER TYPE "ChecklistType" ADD VALUE IF NOT EXISTS 'INSPECTION';

-- InspectionDeduction: categories + responsibility
ALTER TABLE "InspectionDeduction" ADD COLUMN "category" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN "responsibility" TEXT;

-- ChecklistTemplate: category (RESIDENTIAL/FURNISHED/COMMERCIAL/SHORT_STAY/CUSTOM)
ALTER TABLE "ChecklistTemplate" ADD COLUMN "category" TEXT;

-- ChecklistTemplateItem: default quantity
ALTER TABLE "ChecklistTemplateItem" ADD COLUMN "defaultQty" INTEGER NOT NULL DEFAULT 1;

-- TenantChecklistEntry: rich inspection fields
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "qty" INTEGER;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "statusIn" TEXT;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "statusOut" TEXT;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "chargeKes" DOUBLE PRECISION;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "responsibility" TEXT;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "actionRequired" TEXT;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "photoInUrl" TEXT;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "photoOutUrl" TEXT;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN "customFields" JSONB;
