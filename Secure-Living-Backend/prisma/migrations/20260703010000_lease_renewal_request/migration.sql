-- Tenant Portal "Request Renewal" (Update-2.md): tenant can flag they want to renew;
-- the landlord still authors the actual renewal lease via the existing /renew endpoint.
ALTER TABLE "Lease" ADD COLUMN IF NOT EXISTS "renewalRequestedAt" TIMESTAMP(3);
