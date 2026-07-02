-- Visitor ban/blacklist audit trail: landlords/staff can blacklist, only Super Admin can clear it.
ALTER TABLE "Visitor" ADD COLUMN IF NOT EXISTS "blacklistReason" TEXT;
ALTER TABLE "Visitor" ADD COLUMN IF NOT EXISTS "blacklistedAt" TIMESTAMP(3);
ALTER TABLE "Visitor" ADD COLUMN IF NOT EXISTS "blacklistedBy" TEXT;
