-- Admin feature masking/deactivation (UPDATE.md: "Allow masking (hiding) of
-- features. Allow deactivation of features.")
CREATE TABLE IF NOT EXISTS "FeatureFlag" (
    "id"             TEXT NOT NULL,
    "key"            TEXT NOT NULL,
    "label"          TEXT NOT NULL,
    "description"    TEXT,
    "scope"          TEXT NOT NULL DEFAULT 'GLOBAL',
    "organizationId" TEXT,
    "isEnabled"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_organizationId_key" ON "FeatureFlag"("key", "organizationId");
CREATE INDEX IF NOT EXISTS "FeatureFlag_key_idx" ON "FeatureFlag"("key");
CREATE INDEX IF NOT EXISTS "FeatureFlag_organizationId_idx" ON "FeatureFlag"("organizationId");
