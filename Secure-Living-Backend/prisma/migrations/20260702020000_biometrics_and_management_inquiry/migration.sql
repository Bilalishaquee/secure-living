-- Biometric door-access linking for properties that have adopted biometric access control.
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "biometricEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "biometricProvider" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "biometricDeviceId" TEXT;

-- Management Assistance inquiry workflow (self-managed landlord -> admin invitation/takeover).
CREATE TABLE IF NOT EXISTS "ManagementInquiry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagementInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ManagementInquiry_organizationId_status_idx" ON "ManagementInquiry"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "ManagementInquiry_branchId_status_idx" ON "ManagementInquiry"("branchId", "status");
CREATE INDEX IF NOT EXISTS "ManagementInquiry_propertyId_idx" ON "ManagementInquiry"("propertyId");
CREATE INDEX IF NOT EXISTS "ManagementInquiry_landlordId_idx" ON "ManagementInquiry"("landlordId");
