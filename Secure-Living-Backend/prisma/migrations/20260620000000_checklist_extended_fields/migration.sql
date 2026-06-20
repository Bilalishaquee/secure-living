-- Checklist Extended Fields + Property/Org Onboarding Fields
-- Applied via prisma db push; migration recorded here for prisma migrate deploy on Vercel.
-- All statements use ADD COLUMN IF NOT EXISTS to be safe against double-application.

-- TenantChecklistEntry: replacement cost, follow-up date, evidence score
ALTER TABLE "TenantChecklistEntry" ADD COLUMN IF NOT EXISTS "replacementCostKes" DOUBLE PRECISION;
ALTER TABLE "TenantChecklistEntry" ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP(3);
ALTER TABLE "TenantChecklistEntry" ADD COLUMN IF NOT EXISTS "evidenceScore" TEXT;

-- ChecklistTemplateItem: utility meter flag
ALTER TABLE "ChecklistTemplateItem" ADD COLUMN IF NOT EXISTS "isUtilityMeter" BOOLEAN NOT NULL DEFAULT false;

-- Property: caretaker and utility provider
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "caretaker" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "utilityProvider" TEXT;

-- Organization: owner/landlord fields for compliance and payouts
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "kraPin" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "bankPayoutAccount" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "preferredReportingDate" INTEGER;
