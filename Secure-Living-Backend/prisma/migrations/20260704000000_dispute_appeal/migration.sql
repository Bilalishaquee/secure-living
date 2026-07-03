-- Rectification Process (UPDATE.md): "Dispute Declined -> Appeal -> Review"
ALTER TYPE "DisputeStatus" ADD VALUE IF NOT EXISTS 'UNDER_APPEAL';

ALTER TABLE "UtilityDispute" ADD COLUMN IF NOT EXISTS "appealReason" TEXT;
ALTER TABLE "UtilityDispute" ADD COLUMN IF NOT EXISTS "appealedAt" TIMESTAMP(3);
