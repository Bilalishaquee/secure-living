-- Management Takeover Workflow: full status set + regional routing + escalation
ALTER TABLE "ManagementInquiry" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "ManagementInquiry" ADD COLUMN IF NOT EXISTS "assignedAdminId" TEXT;
ALTER TABLE "ManagementInquiry" ADD COLUMN IF NOT EXISTS "escalatedToSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ManagementInquiry" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "ManagementInquiry" ADD COLUMN IF NOT EXISTS "escalationReason" TEXT;
ALTER TABLE "ManagementInquiry" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- Migrate any existing rows to the client's exact status vocabulary
UPDATE "ManagementInquiry" SET "status" = 'SUBMITTED' WHERE "status" = 'PENDING';
UPDATE "ManagementInquiry" SET "status" = 'INVITATION_SENT' WHERE "status" = 'INVITED';
UPDATE "ManagementInquiry" SET "status" = 'CLOSED' WHERE "status" = 'COMPLETED';

CREATE INDEX IF NOT EXISTS "ManagementInquiry_assignedAdminId_idx" ON "ManagementInquiry"("assignedAdminId");
CREATE INDEX IF NOT EXISTS "ManagementInquiry_region_idx" ON "ManagementInquiry"("region");

-- Organization Management: agency approval checklist/rejection + activate/deactivate lifecycle
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "reviewChecklist" JSONB;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "reapplicationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "deactivationReason" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "deactivatedBy" TEXT;
