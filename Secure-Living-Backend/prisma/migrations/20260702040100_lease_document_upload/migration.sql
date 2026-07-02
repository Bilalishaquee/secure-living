-- Signed lease document upload, so the "Upload Lease" button in the Leasing module actually works.
ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "documentUrl" TEXT;
ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "documentFileName" TEXT;
ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "documentUploadedAt" TIMESTAMP(3);
