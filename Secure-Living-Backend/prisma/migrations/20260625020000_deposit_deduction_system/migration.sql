ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "depositModel" TEXT NOT NULL DEFAULT 'LANDLORD_RESERVE';

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "depositModel" TEXT NOT NULL DEFAULT 'LANDLORD_RESERVE';
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "escrowBadge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "fullyCoveredBadge" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "InspectionDeduction" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'proposed';

ALTER TABLE "TenantChecklist" ADD COLUMN IF NOT EXISTS "checklistData" JSONB;
ALTER TABLE "TenantChecklist" ADD COLUMN IF NOT EXISTS "signedByTenant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TenantChecklist" ADD COLUMN IF NOT EXISTS "signedByLandlord" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TenantChecklist" ADD COLUMN IF NOT EXISTS "gpsVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "DepositEscrow" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "landlordId" TEXT,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'LANDLORD_RESERVE',
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "topUpLog" JSONB,
    "heldSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletWatchActive" BOOLEAN NOT NULL DEFAULT false,
    "healthStatus" TEXT NOT NULL DEFAULT 'fully_covered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositEscrow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DepositTopUpRequest" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "disputeResolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositTopUpRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LandlordRefundScore" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "score" TEXT NOT NULL DEFAULT 'prompt',
    "totalRefunds" INTEGER NOT NULL DEFAULT 0,
    "onTimeRefunds" INTEGER NOT NULL DEFAULT 0,
    "disputedRefunds" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandlordRefundScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DepositEscrow_leaseId_key" ON "DepositEscrow"("leaseId");
CREATE INDEX IF NOT EXISTS "DepositEscrow_organizationId_status_idx" ON "DepositEscrow"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "DepositEscrow_tenantId_idx" ON "DepositEscrow"("tenantId");
CREATE INDEX IF NOT EXISTS "DepositEscrow_landlordId_idx" ON "DepositEscrow"("landlordId");
CREATE INDEX IF NOT EXISTS "DepositEscrow_propertyId_idx" ON "DepositEscrow"("propertyId");
CREATE INDEX IF NOT EXISTS "DepositEscrow_unitId_idx" ON "DepositEscrow"("unitId");
CREATE INDEX IF NOT EXISTS "DepositEscrow_healthStatus_idx" ON "DepositEscrow"("healthStatus");

CREATE INDEX IF NOT EXISTS "DepositTopUpRequest_leaseId_status_idx" ON "DepositTopUpRequest"("leaseId", "status");
CREATE INDEX IF NOT EXISTS "DepositTopUpRequest_organizationId_status_idx" ON "DepositTopUpRequest"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "DepositTopUpRequest_requestedBy_idx" ON "DepositTopUpRequest"("requestedBy");

CREATE UNIQUE INDEX IF NOT EXISTS "LandlordRefundScore_landlordId_key" ON "LandlordRefundScore"("landlordId");
CREATE INDEX IF NOT EXISTS "LandlordRefundScore_score_idx" ON "LandlordRefundScore"("score");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DepositEscrow_leaseId_fkey'
  ) THEN
    ALTER TABLE "DepositEscrow"
    ADD CONSTRAINT "DepositEscrow_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
