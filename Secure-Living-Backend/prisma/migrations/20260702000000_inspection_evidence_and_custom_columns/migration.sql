-- Structured evidence fields for InspectionDeduction (Secure Living Dynamic Inspection & Deposit Deduction System)
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "beforePhotoUrl" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "afterPhotoUrl" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "repairQuoteUrl" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "inspectorNote" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "billOrMeterRef" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "disputeNote" TEXT;
ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Landlord-defined custom checklist columns (e.g. Tenant Initials, Inspector Notes, Contractor Quote, Invoice Upload)
ALTER TABLE "ChecklistTemplate" ADD COLUMN IF NOT EXISTS "customColumns" JSONB;
