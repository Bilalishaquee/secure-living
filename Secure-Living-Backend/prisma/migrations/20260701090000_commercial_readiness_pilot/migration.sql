-- Commercial readiness pilot: subscription lifecycle, billing history, referrals, and rewards.

ALTER TABLE "UserPackageSubscription"
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acquisitionSource" TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS "referralId" TEXT,
  ADD COLUMN IF NOT EXISTS "renewalReminderAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "SubscriptionBillingHistory" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "organizationId" TEXT,
  "userId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "billingCycle" TEXT NOT NULL,
  "amountKes" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "invoiceNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paymentMethod" TEXT,
  "paymentReference" TEXT,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "SubscriptionBillingHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReferralCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "referrerUserId" TEXT NOT NULL,
  "referrerRole" TEXT NOT NULL,
  "organizationId" TEXT,
  "rewardType" TEXT NOT NULL DEFAULT 'free_subscription_period',
  "rewardValue" TEXT NOT NULL DEFAULT '1_month',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Referral" (
  "id" TEXT NOT NULL,
  "referralCodeId" TEXT NOT NULL,
  "referredUserId" TEXT,
  "referredEmail" TEXT,
  "referredName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'invited',
  "acquisitionSource" TEXT NOT NULL DEFAULT 'referral',
  "qualificationNote" TEXT,
  "rewardType" TEXT,
  "rewardValue" TEXT,
  "rewardEligible" BOOLEAN NOT NULL DEFAULT false,
  "rewardApprovedAt" TIMESTAMP(3),
  "rewardApprovedBy" TEXT,
  "rewardIssuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReferralActivity" (
  "id" TEXT NOT NULL,
  "referralId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "eventType" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionBillingHistory_invoiceNumber_key" ON "SubscriptionBillingHistory"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCode_code_key" ON "ReferralCode"("code");

CREATE INDEX IF NOT EXISTS "UserPackageSubscription_acquisitionSource_idx" ON "UserPackageSubscription"("acquisitionSource");
CREATE INDEX IF NOT EXISTS "UserPackageSubscription_referralId_idx" ON "UserPackageSubscription"("referralId");
CREATE INDEX IF NOT EXISTS "SubscriptionBillingHistory_organizationId_status_idx" ON "SubscriptionBillingHistory"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "SubscriptionBillingHistory_userId_issuedAt_idx" ON "SubscriptionBillingHistory"("userId", "issuedAt");
CREATE INDEX IF NOT EXISTS "SubscriptionBillingHistory_subscriptionId_issuedAt_idx" ON "SubscriptionBillingHistory"("subscriptionId", "issuedAt");
CREATE INDEX IF NOT EXISTS "ReferralCode_referrerUserId_idx" ON "ReferralCode"("referrerUserId");
CREATE INDEX IF NOT EXISTS "ReferralCode_organizationId_idx" ON "ReferralCode"("organizationId");
CREATE INDEX IF NOT EXISTS "ReferralCode_isActive_idx" ON "ReferralCode"("isActive");
CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");
CREATE INDEX IF NOT EXISTS "Referral_referredUserId_idx" ON "Referral"("referredUserId");
CREATE INDEX IF NOT EXISTS "Referral_referredEmail_idx" ON "Referral"("referredEmail");
CREATE INDEX IF NOT EXISTS "Referral_referralCodeId_status_idx" ON "Referral"("referralCodeId", "status");
CREATE INDEX IF NOT EXISTS "Referral_acquisitionSource_idx" ON "Referral"("acquisitionSource");
CREATE INDEX IF NOT EXISTS "ReferralActivity_referralId_createdAt_idx" ON "ReferralActivity"("referralId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReferralActivity_eventType_idx" ON "ReferralActivity"("eventType");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SubscriptionBillingHistory_subscriptionId_fkey'
  ) THEN
    ALTER TABLE "SubscriptionBillingHistory"
      ADD CONSTRAINT "SubscriptionBillingHistory_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "UserPackageSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Referral_referralCodeId_fkey'
  ) THEN
    ALTER TABLE "Referral"
      ADD CONSTRAINT "Referral_referralCodeId_fkey"
      FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ReferralActivity_referralId_fkey'
  ) THEN
    ALTER TABLE "ReferralActivity"
      ADD CONSTRAINT "ReferralActivity_referralId_fkey"
      FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserPackageSubscription_referralId_fkey'
  ) THEN
    ALTER TABLE "UserPackageSubscription"
      ADD CONSTRAINT "UserPackageSubscription_referralId_fkey"
      FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
