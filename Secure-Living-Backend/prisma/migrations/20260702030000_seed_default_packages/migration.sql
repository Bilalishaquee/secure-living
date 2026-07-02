-- Seed at least 4 subscription/price packages (UPDATE.md: "The price packages should be
-- at least 4, or the admin can add more packages"). Idempotent — safe to re-run, and
-- admins can still add/edit further packages via the API afterwards.
INSERT INTO "Package" ("id", "name", "tier", "listingSlots", "hasServiceRequests", "serviceRequestMonthlyLimit", "monthlyPriceKes", "isListingOnly", "annualDiscountEligible", "overageSlotFeeKes", "isActive", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Free', 'FREE', 1, true, 3, 0, false, false, 150, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Self-Management', 'STARTER', 5, true, 20, 1500, false, true, 150, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Professional Management', 'PROFESSIONAL', 25, true, NULL, 5000, false, true, 150, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Enterprise', 'ENTERPRISE', 999, true, NULL, 15000, false, true, 100, true, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;
