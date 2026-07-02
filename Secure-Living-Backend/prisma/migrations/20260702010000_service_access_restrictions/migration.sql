-- Admin-managed service access restrictions (UPDATE.md: "The admin should be able
-- to restrict which services users can offer or access.")
CREATE TABLE IF NOT EXISTS "ServiceAccessRestriction" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT,
    "userId"         TEXT,
    "serviceType"    TEXT NOT NULL,
    "mode"           TEXT NOT NULL,
    "reason"         TEXT,
    "createdBy"      TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAccessRestriction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceAccessRestriction_organizationId_userId_serviceType_key"
    ON "ServiceAccessRestriction"("organizationId", "userId", "serviceType");
CREATE INDEX IF NOT EXISTS "ServiceAccessRestriction_organizationId_idx" ON "ServiceAccessRestriction"("organizationId");
CREATE INDEX IF NOT EXISTS "ServiceAccessRestriction_userId_idx" ON "ServiceAccessRestriction"("userId");
CREATE INDEX IF NOT EXISTS "ServiceAccessRestriction_serviceType_idx" ON "ServiceAccessRestriction"("serviceType");
