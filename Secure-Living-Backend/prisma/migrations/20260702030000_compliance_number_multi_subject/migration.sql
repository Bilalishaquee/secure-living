-- Compliance numbers: extend beyond tenants to properties/agents/users (Secure Living
-- doc: "Properties/agents/users (not tenants only) should be given compliance number").
ALTER TABLE "ComplianceNumber" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "ComplianceNumber" ADD COLUMN IF NOT EXISTS "subjectType" TEXT NOT NULL DEFAULT 'TENANT';
ALTER TABLE "ComplianceNumber" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;

-- Backfill: every existing row is a legacy tenant compliance number.
UPDATE "ComplianceNumber" SET "subjectId" = "tenantId", "subjectType" = 'TENANT' WHERE "subjectId" IS NULL;

CREATE INDEX IF NOT EXISTS "ComplianceNumber_subjectType_subjectId_idx" ON "ComplianceNumber"("subjectType", "subjectId");
