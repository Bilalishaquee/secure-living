-- Post-migration data linking: let a landlord manually match imported legacy
-- tenant/unit references (raw strings from the import file) to real Unit/AppUser records.
ALTER TABLE "PastRentRecord" ADD COLUMN IF NOT EXISTS "linkStatus" TEXT NOT NULL DEFAULT 'unlinked';
ALTER TABLE "PastRentRecord" ADD COLUMN IF NOT EXISTS "linkedUnitId" TEXT;
ALTER TABLE "PastRentRecord" ADD COLUMN IF NOT EXISTS "linkedTenantUserId" TEXT;

CREATE INDEX IF NOT EXISTS "PastRentRecord_organizationId_linkStatus_idx" ON "PastRentRecord"("organizationId", "linkStatus");
