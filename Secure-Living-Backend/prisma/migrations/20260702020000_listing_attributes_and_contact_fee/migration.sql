-- Listing custom attributes + admin-editable contact-unlock fee
-- (Secure Living UPDATE.md: "Listing Details" + "images... payment is done for one to
-- see the contact... which should not be fixed admin can edit the charges")
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "customAttributes" JSONB;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "contactUnlockFeeKes" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "ListingContactUnlock" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "unlockedByUserId" TEXT NOT NULL,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingContactUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ListingContactUnlock_listingId_unlockedByUserId_key" ON "ListingContactUnlock"("listingId", "unlockedByUserId");
CREATE INDEX IF NOT EXISTS "ListingContactUnlock_listingId_idx" ON "ListingContactUnlock"("listingId");
CREATE INDEX IF NOT EXISTS "ListingContactUnlock_unlockedByUserId_idx" ON "ListingContactUnlock"("unlockedByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ListingContactUnlock_listingId_fkey'
  ) THEN
    ALTER TABLE "ListingContactUnlock"
    ADD CONSTRAINT "ListingContactUnlock_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
