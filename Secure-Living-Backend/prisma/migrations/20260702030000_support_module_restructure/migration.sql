-- Support Module Restructure (UPDATE.md): expand ServiceEnquiry's workflow to
-- Received -> Assigned -> Quotation Sent -> Accepted -> In Progress -> Completed -> Closed.
-- NEW/CANCELLED kept for backward compatibility with existing rows.
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'RECEIVED';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'QUOTATION_SENT';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "EnquiryStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

ALTER TABLE "ServiceEnquiry" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "ServiceEnquiry" ADD COLUMN IF NOT EXISTS "quotationAmount" DOUBLE PRECISION;
ALTER TABLE "ServiceEnquiry" ADD COLUMN IF NOT EXISTS "completionDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ServiceEnquiry_propertyId_idx" ON "ServiceEnquiry"("propertyId");
