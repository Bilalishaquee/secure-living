-- Lets a tenant self-register a visitor for their own unit (visitor:create, scoped)
-- distinct from staff/landlord adding any visitor org-wide (visitor:manage).
ALTER TABLE "Visitor" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
CREATE INDEX IF NOT EXISTS "Visitor_createdByUserId_idx" ON "Visitor"("createdByUserId");
