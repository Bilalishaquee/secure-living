-- Lease Offer workflow (Update-2.md "Tenant Portal — My Lease / Lease Offer"): a lease
-- created from an accepted application starts as status "offered" until the tenant
-- accepts & signs (-> "active") or declines (-> "declined").

ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "applicationId" TEXT;
ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "tenantSignedAt" TIMESTAMP(3);
ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "declinedAt" TIMESTAMP(3);
ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "declineReason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Lease_applicationId_key" ON "Lease"("applicationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Lease_applicationId_fkey'
  ) THEN
    ALTER TABLE "Lease"
    ADD CONSTRAINT "Lease_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "RentalApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LeaseQuestion" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "askedBy" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredBy" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeaseQuestion_leaseId_idx" ON "LeaseQuestion"("leaseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LeaseQuestion_leaseId_fkey'
  ) THEN
    ALTER TABLE "LeaseQuestion"
    ADD CONSTRAINT "LeaseQuestion_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
