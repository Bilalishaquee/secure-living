-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('UNVERIFIED', 'IDENTITY_VERIFIED', 'COMPLIANCE_VERIFIED', 'TRUSTED_PERSONNEL', 'ENTERPRISE_VERIFIED');

-- CreateEnum
CREATE TYPE "FreezeType" AS ENUM ('SOFT', 'HARD');

-- CreateEnum
CREATE TYPE "FreezeStatus" AS ENUM ('ACTIVE', 'LIFTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'UPHELD', 'OVERTURNED');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('WATER', 'ELECTRICITY');

-- CreateEnum
CREATE TYPE "BillingModel" AS ENUM ('FLAT_RATE', 'SUB_METERED_MANUAL', 'SUB_METERED_IOT');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('PRO_RATA', 'FLAT_AMOUNT');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'LANDLORD_RESPONDED', 'ESCALATED', 'RESOLVED_ACCEPTED', 'RESOLVED_REJECTED');

-- CreateEnum
CREATE TYPE "DepositTransferStatus" AS ENUM ('LISTED', 'BUYER_PAID', 'LANDLORD_APPROVED', 'INSPECTION_COMPLETE', 'RELEASED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageTier" AS ENUM ('FREE', 'LISTING_ONLY', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TrustedPersonnelStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DocumentRequestEnforcement" AS ENUM ('REMINDER', 'SOFT_FREEZE', 'HARD_FREEZE');

-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'UPLOADED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "AppUser" ADD COLUMN     "diditSessionId" TEXT,
ADD COLUMN     "fraudScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "goodConductExpiresAt" TIMESTAMP(3),
ADD COLUMN     "goodConductUploadedAt" TIMESTAMP(3),
ADD COLUMN     "iprsCheckedAt" TIMESTAMP(3),
ADD COLUMN     "iprsResult" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "qrToken" TEXT,
ADD COLUMN     "qrTokenRotatedAt" TIMESTAMP(3),
ADD COLUMN     "trustedPersonnelReviewedAt" TIMESTAMP(3),
ADD COLUMN     "trustedPersonnelReviewedBy" TEXT,
ADD COLUMN     "trustedPersonnelStatus" "TrustedPersonnelStatus",
ADD COLUMN     "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verificationLevelSetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "PackageTier" NOT NULL,
    "listingSlots" INTEGER NOT NULL,
    "hasServiceRequests" BOOLEAN NOT NULL DEFAULT true,
    "serviceRequestMonthlyLimit" INTEGER,
    "monthlyPriceKes" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isListingOnly" BOOLEAN NOT NULL DEFAULT false,
    "annualDiscountEligible" BOOLEAN NOT NULL DEFAULT true,
    "overageSlotFeeKes" DECIMAL(65,30) NOT NULL DEFAULT 150,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPackageSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "packageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextBillingAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "srUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "srCounterResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPackageSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountFreeze" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "freezeType" "FreezeType" NOT NULL,
    "status" "FreezeStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "requiredAction" TEXT,
    "appliedBy" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liftedAt" TIMESTAMP(3),
    "liftedBy" TEXT,
    "liftReason" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreezeAppeal" (
    "id" TEXT NOT NULL,
    "freezeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "status" "AppealStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "decisionReason" TEXT,
    "isSecondAppeal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FreezeAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL,
    "nationalIdHash" TEXT,
    "phoneNumbers" TEXT[],
    "emailAddresses" TEXT[],
    "deviceFingerprints" TEXT[],
    "reason" TEXT NOT NULL,
    "evidenceLinks" TEXT[],
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDocumentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "enforcement" "DocumentRequestEnforcement" NOT NULL DEFAULT 'REMINDER',
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedDocUrl" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityMeter" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "type" "UtilityType" NOT NULL,
    "billingModel" "BillingModel" NOT NULL DEFAULT 'FLAT_RATE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityReading" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL,
    "previousReading" DOUBLE PRECISION NOT NULL,
    "currentReading" DOUBLE PRECISION NOT NULL,
    "consumption" DOUBLE PRECISION NOT NULL,
    "flatRateAmountKes" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeStatus" "DisputeStatus",
    "originalReadingId" TEXT,
    "revisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCharge" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allocationMethod" "AllocationMethod" NOT NULL DEFAULT 'PRO_RATA',
    "amountKes" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityDispute" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "raisedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "landlordResponse" TEXT,
    "landlordRespondedAt" TIMESTAMP(3),
    "adminDecision" TEXT,
    "adminDecidedAt" TIMESTAMP(3),
    "adminDecidedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositTransfer" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "outgoingTenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "depositAmountKes" DECIMAL(65,30) NOT NULL,
    "platformFeeKes" DECIMAL(65,30) NOT NULL DEFAULT 500,
    "incomingTenantId" TEXT,
    "status" "DepositTransferStatus" NOT NULL DEFAULT 'LISTED',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerPaidAt" TIMESTAMP(3),
    "landlordApprovedAt" TIMESTAMP(3),
    "inspectionCompletedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "escrowAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Package_name_key" ON "Package"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Package_tier_key" ON "Package"("tier");

-- CreateIndex
CREATE INDEX "UserPackageSubscription_userId_status_idx" ON "UserPackageSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "UserPackageSubscription_organizationId_idx" ON "UserPackageSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "AccountFreeze_userId_status_idx" ON "AccountFreeze"("userId", "status");

-- CreateIndex
CREATE INDEX "AccountFreeze_status_createdAt_idx" ON "AccountFreeze"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FreezeAppeal_freezeId_idx" ON "FreezeAppeal"("freezeId");

-- CreateIndex
CREATE INDEX "FreezeAppeal_userId_status_idx" ON "FreezeAppeal"("userId", "status");

-- CreateIndex
CREATE INDEX "BlacklistEntry_nationalIdHash_idx" ON "BlacklistEntry"("nationalIdHash");

-- CreateIndex
CREATE INDEX "UserDocumentRequest_userId_status_idx" ON "UserDocumentRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "UserDocumentRequest_status_deadline_idx" ON "UserDocumentRequest"("status", "deadline");

-- CreateIndex
CREATE INDEX "UtilityMeter_unitId_isActive_idx" ON "UtilityMeter"("unitId", "isActive");

-- CreateIndex
CREATE INDEX "UtilityReading_meterId_readingDate_idx" ON "UtilityReading"("meterId", "readingDate");

-- CreateIndex
CREATE INDEX "ServiceCharge_propertyId_isActive_idx" ON "ServiceCharge"("propertyId", "isActive");

-- CreateIndex
CREATE INDEX "UtilityDispute_readingId_status_idx" ON "UtilityDispute"("readingId", "status");

-- CreateIndex
CREATE INDEX "DepositTransfer_outgoingTenantId_status_idx" ON "DepositTransfer"("outgoingTenantId", "status");

-- CreateIndex
CREATE INDEX "DepositTransfer_unitId_status_idx" ON "DepositTransfer"("unitId", "status");

-- CreateIndex
CREATE INDEX "DepositTransfer_status_expiresAt_idx" ON "DepositTransfer"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "UserPackageSubscription" ADD CONSTRAINT "UserPackageSubscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountFreeze" ADD CONSTRAINT "AccountFreeze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreezeAppeal" ADD CONSTRAINT "FreezeAppeal_freezeId_fkey" FOREIGN KEY ("freezeId") REFERENCES "AccountFreeze"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreezeAppeal" ADD CONSTRAINT "FreezeAppeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocumentRequest" ADD CONSTRAINT "UserDocumentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityReading" ADD CONSTRAINT "UtilityReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "UtilityMeter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityDispute" ADD CONSTRAINT "UtilityDispute_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "UtilityReading"("id") ON DELETE CASCADE ON UPDATE CASCADE;
