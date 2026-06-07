-- CreateTable
CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "widgetType" TEXT NOT NULL,
    "label" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationCustomField" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "fieldOptions" TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationCustomFieldValue" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "ApplicationCustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvidence" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyOnboardingConfig" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "isShortStayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "visitorApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "gateAccessRequired" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceSla" TEXT,
    "customOnboardingFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOnboardingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataImportJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT,
    "importType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorsJson" JSONB,
    "columnMapping" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastRentRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "propertyId" TEXT,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "rentAmountKes" DOUBLE PRECISION NOT NULL,
    "paidAmountKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "mpesaReference" TEXT,
    "notes" TEXT,
    "importJobId" TEXT,
    "isMigrated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastRentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentReceipt" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "mpesaReference" TEXT,
    "bankReference" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryChannel" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityHouseholdCharge" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "utilityReadingId" TEXT,
    "name" TEXT NOT NULL,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "billingMethod" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "isLinkedToRent" BOOLEAN NOT NULL DEFAULT true,
    "evidenceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityHouseholdCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherCharge" (
    "id" TEXT NOT NULL,
    "shortStayId" TEXT NOT NULL,
    "bookingId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "chargeType" TEXT NOT NULL,
    "isRefundable" BOOLEAN NOT NULL DEFAULT false,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyTransferRecord" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "previousOwnerId" TEXT NOT NULL,
    "newOwnerId" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferType" TEXT NOT NULL,
    "saleAmountKes" DOUBLE PRECISION,
    "notes" TEXT,
    "preservedJson" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyTransferRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "propertyId" TEXT,
    "unitId" TEXT,
    "assignedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoveScoreRecord" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "factorsJson" JSONB,
    "predictedDate" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoveScoreRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveIntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "trend" TEXT NOT NULL,
    "dataJson" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentScoreRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "consistency" DOUBLE PRECISION NOT NULL,
    "totalPaidOnTime" INTEGER NOT NULL DEFAULT 0,
    "totalPaidLate" INTEGER NOT NULL DEFAULT 0,
    "totalArrears" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageDaysEarly" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentScoreRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceNumber" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "complianceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "complianceNumberId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "evidenceUrl" TEXT,
    "checkedBy" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroBehaviorRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "behaviorType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "score" DOUBLE PRECISION,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroBehaviorRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrApplication" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "unitId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "applicantEmail" TEXT,
    "qrToken" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadataJson" JSONB,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrAccessLog" (
    "id" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "accessType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "idNumber" TEXT,
    "vehicleNumber" TEXT,
    "photoUrl" TEXT,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "purpose" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "authorizedBy" TEXT,
    "approvalStatus" TEXT NOT NULL,
    "approvalMethod" TEXT,
    "notes" TEXT,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Container_organizationId_idx" ON "Container"("organizationId");

-- CreateIndex
CREATE INDEX "ContainerManager_containerId_idx" ON "ContainerManager"("containerId");

-- CreateIndex
CREATE INDEX "ContainerManager_userId_idx" ON "ContainerManager"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VacatingNotice_leaseId_key" ON "VacatingNotice"("leaseId");

-- CreateIndex
CREATE INDEX "VacatingNotice_organizationId_status_idx" ON "VacatingNotice"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VacatingNotice_unitId_idx" ON "VacatingNotice"("unitId");

-- CreateIndex
CREATE INDEX "VacatingNotice_tenantId_idx" ON "VacatingNotice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MoveOutInspection_vacatingNoticeId_key" ON "MoveOutInspection"("vacatingNoticeId");

-- CreateIndex
CREATE INDEX "MoveOutInspection_organizationId_idx" ON "MoveOutInspection"("organizationId");

-- CreateIndex
CREATE INDEX "InspectionDeduction_inspectionId_idx" ON "InspectionDeduction"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositRefund_vacatingNoticeId_key" ON "DepositRefund"("vacatingNoticeId");

-- CreateIndex
CREATE INDEX "DepositRefund_organizationId_status_idx" ON "DepositRefund"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_organizationId_idx" ON "ChecklistTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "ChecklistTemplateItem_templateId_order_idx" ON "ChecklistTemplateItem"("templateId", "order");

-- CreateIndex
CREATE INDEX "TenantChecklist_leaseId_idx" ON "TenantChecklist"("leaseId");

-- CreateIndex
CREATE INDEX "TenantChecklist_unitId_idx" ON "TenantChecklist"("unitId");

-- CreateIndex
CREATE INDEX "TenantChecklist_tenantId_idx" ON "TenantChecklist"("tenantId");

-- CreateIndex
CREATE INDEX "TenantChecklistEntry_checklistId_idx" ON "TenantChecklistEntry"("checklistId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_unitId_key" ON "Listing"("unitId");

-- CreateIndex
CREATE INDEX "Listing_organizationId_status_idx" ON "Listing"("organizationId", "status");

-- CreateIndex
CREATE INDEX "RentalApplication_listingId_status_idx" ON "RentalApplication"("listingId", "status");

-- CreateIndex
CREATE INDEX "RentalApplication_applicantId_idx" ON "RentalApplication"("applicantId");

-- CreateIndex
CREATE INDEX "MonthlyRentSummary_organizationId_idx" ON "MonthlyRentSummary"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRentSummary_organizationId_periodYear_periodMonth_key" ON "MonthlyRentSummary"("organizationId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "UserRoleContext_userId_isActive_idx" ON "UserRoleContext"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_isActive_order_idx" ON "ServiceCategory"("isActive", "order");

-- CreateIndex
CREATE INDEX "ServiceEnquiry_serviceCategoryId_status_idx" ON "ServiceEnquiry"("serviceCategoryId", "status");

-- CreateIndex
CREATE INDEX "ServiceEnquiry_status_createdAt_idx" ON "ServiceEnquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShortStayProperty_unitId_key" ON "ShortStayProperty"("unitId");

-- CreateIndex
CREATE INDEX "ShortStayProperty_organizationId_idx" ON "ShortStayProperty"("organizationId");

-- CreateIndex
CREATE INDEX "ShortStayBooking_shortStayId_status_idx" ON "ShortStayBooking"("shortStayId", "status");

-- CreateIndex
CREATE INDEX "ShortStayBooking_organizationId_checkInDate_idx" ON "ShortStayBooking"("organizationId", "checkInDate");

-- CreateIndex
CREATE INDEX "StockItem_shortStayId_idx" ON "StockItem"("shortStayId");

-- CreateIndex
CREATE INDEX "BookingStockUsage_bookingId_idx" ON "BookingStockUsage"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_idempotencyKey_key" ON "ServiceRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ServiceRequest_organizationId_branchId_status_idx" ON "ServiceRequest"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "ServiceRequest_organizationId_branchId_srStatus_idx" ON "ServiceRequest"("organizationId", "branchId", "srStatus");

-- CreateIndex
CREATE INDEX "ServiceRequest_propertyId_unitId_idx" ON "ServiceRequest"("propertyId", "unitId");

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceType_srStatus_idx" ON "ServiceRequest"("serviceType", "srStatus");

-- CreateIndex
CREATE INDEX "ServiceRequest_shortStayBookingId_idx" ON "ServiceRequest"("shortStayBookingId");

-- CreateIndex
CREATE INDEX "ServiceRequestEvidence_serviceRequestId_createdAt_idx" ON "ServiceRequestEvidence"("serviceRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfessionalProfile_organizationId_branchId_isActive_idx" ON "ProfessionalProfile"("organizationId", "branchId", "isActive");

-- CreateIndex
CREATE INDEX "JobAssignment_serviceRequestId_professionalUserId_idx" ON "JobAssignment"("serviceRequestId", "professionalUserId");

-- CreateIndex
CREATE INDEX "Wallet_ownerType_ownerId_walletType_idx" ON "Wallet"("ownerType", "ownerId", "walletType");

-- CreateIndex
CREATE INDEX "LedgerEntry_walletId_createdAt_idx" ON "LedgerEntry"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_propertyId_transactionType_creat_idx" ON "Transaction"("organizationId", "propertyId", "transactionType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EscrowAccount_leaseId_status_idx" ON "EscrowAccount"("leaseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RentInvoice_invoiceNumber_key" ON "RentInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "RentInvoice_leaseId_dueDate_status_idx" ON "RentInvoice"("leaseId", "dueDate", "status");

-- CreateIndex
CREATE INDEX "Unit_organizationId_branchId_propertyId_status_idx" ON "Unit"("organizationId", "branchId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "Unit_readinessStatus_idx" ON "Unit"("readinessStatus");

-- CreateIndex
CREATE INDEX "Property_organizationId_branchId_status_idx" ON "Property"("organizationId", "branchId", "status");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_containerId_idx" ON "Property"("containerId");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Branch_organizationId_status_idx" ON "Branch"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_userId_status_idx" ON "UserRoleAssignment"("userId", "status");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_organizationId_branchId_idx" ON "UserRoleAssignment"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "ApiSession_userId_expiresAt_idx" ON "ApiSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "KycDocument_userId_status_uploadedAt_idx" ON "KycDocument"("userId", "status", "uploadedAt");

-- CreateIndex
CREATE INDEX "PropertyRoleAssignment_propertyId_roleType_idx" ON "PropertyRoleAssignment"("propertyId", "roleType");

-- CreateIndex
CREATE INDEX "PropertyRoleAssignment_userId_roleType_idx" ON "PropertyRoleAssignment"("userId", "roleType");

-- CreateIndex
CREATE INDEX "Expense_organizationId_branchId_propertyId_date_idx" ON "Expense"("organizationId", "branchId", "propertyId", "date");

-- CreateIndex
CREATE INDEX "Expense_category_date_idx" ON "Expense"("category", "date");

-- CreateIndex
CREATE INDEX "FinancialReport_organizationId_propertyId_reportType_period_idx" ON "FinancialReport"("organizationId", "propertyId", "reportType", "periodStart");

-- CreateIndex
CREATE INDEX "LeaseRenewalAlert_expiryDate_status_idx" ON "LeaseRenewalAlert"("expiryDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_inviteToken_key" ON "TeamInvitation"("inviteToken");

-- CreateIndex
CREATE INDEX "TeamInvitation_organizationId_status_idx" ON "TeamInvitation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TeamInvitation_inviteeEmail_idx" ON "TeamInvitation"("inviteeEmail");

-- CreateIndex
CREATE INDEX "ServiceRequestHistory_serviceRequestId_changedAt_idx" ON "ServiceRequestHistory"("serviceRequestId", "changedAt");

-- CreateIndex
CREATE INDEX "ServiceRequestAssignment_serviceRequestId_idx" ON "ServiceRequestAssignment"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ServiceRequestAssignment_assignedTo_idx" ON "ServiceRequestAssignment"("assignedTo");

-- CreateIndex
CREATE INDEX "ServiceRequestEscalation_serviceRequestId_idx" ON "ServiceRequestEscalation"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ServiceRequestQuote_serviceRequestId_status_idx" ON "ServiceRequestQuote"("serviceRequestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SlaPolicy_serviceType_key" ON "SlaPolicy"("serviceType");

-- CreateIndex
CREATE INDEX "ServiceProvider_organizationId_status_idx" ON "ServiceProvider"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ServiceProvider_userId_idx" ON "ServiceProvider"("userId");

-- CreateIndex
CREATE INDEX "ServiceProviderAuditLog_providerId_createdAt_idx" ON "ServiceProviderAuditLog"("providerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProviderPerformance_providerId_key" ON "ServiceProviderPerformance"("providerId");

-- CreateIndex
CREATE INDEX "OutboxEvent_processed_createdAt_idx" ON "OutboxEvent"("processed", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_eventType_idx" ON "OutboxEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "CustomTypeDefinition_name_key" ON "CustomTypeDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTypeConfig_serviceType_key" ON "ServiceTypeConfig"("serviceType");

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
CREATE INDEX "DashboardWidget_userId_position_idx" ON "DashboardWidget"("userId", "position");

-- CreateIndex
CREATE INDEX "DashboardWidget_organizationId_idx" ON "DashboardWidget"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidget_userId_widgetType_key" ON "DashboardWidget"("userId", "widgetType");

-- CreateIndex
CREATE INDEX "ApplicationCustomField_organizationId_isActive_idx" ON "ApplicationCustomField"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ApplicationCustomFieldValue_applicationId_idx" ON "ApplicationCustomFieldValue"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationCustomFieldValue_fieldId_idx" ON "ApplicationCustomFieldValue"("fieldId");

-- CreateIndex
CREATE INDEX "ApplicationEvidence_applicationId_idx" ON "ApplicationEvidence"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOnboardingConfig_propertyId_key" ON "PropertyOnboardingConfig"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyOnboardingConfig_propertyId_idx" ON "PropertyOnboardingConfig"("propertyId");

-- CreateIndex
CREATE INDEX "DataImportJob_organizationId_status_idx" ON "DataImportJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DataImportJob_importType_createdAt_idx" ON "DataImportJob"("importType", "createdAt");

-- CreateIndex
CREATE INDEX "PastRentRecord_organizationId_tenantId_idx" ON "PastRentRecord"("organizationId", "tenantId");

-- CreateIndex
CREATE INDEX "PastRentRecord_tenantId_periodYear_periodMonth_idx" ON "PastRentRecord"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "PastRentRecord_tenantId_unitId_periodYear_periodMonth_key" ON "PastRentRecord"("tenantId", "unitId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "RentReceipt_receiptNumber_key" ON "RentReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "RentReceipt_invoiceId_idx" ON "RentReceipt"("invoiceId");

-- CreateIndex
CREATE INDEX "RentReceipt_tenantId_receiptDate_idx" ON "RentReceipt"("tenantId", "receiptDate");

-- CreateIndex
CREATE INDEX "RentReceipt_receiptNumber_idx" ON "RentReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "UtilityHouseholdCharge_unitId_isLinkedToRent_idx" ON "UtilityHouseholdCharge"("unitId", "isLinkedToRent");

-- CreateIndex
CREATE INDEX "UtilityHouseholdCharge_invoiceId_idx" ON "UtilityHouseholdCharge"("invoiceId");

-- CreateIndex
CREATE INDEX "UtilityHouseholdCharge_propertyId_idx" ON "UtilityHouseholdCharge"("propertyId");

-- CreateIndex
CREATE INDEX "OtherCharge_shortStayId_idx" ON "OtherCharge"("shortStayId");

-- CreateIndex
CREATE INDEX "OtherCharge_bookingId_idx" ON "OtherCharge"("bookingId");

-- CreateIndex
CREATE INDEX "PropertyTransferRecord_propertyId_idx" ON "PropertyTransferRecord"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyTransferRecord_previousOwnerId_idx" ON "PropertyTransferRecord"("previousOwnerId");

-- CreateIndex
CREATE INDEX "PropertyTransferRecord_newOwnerId_idx" ON "PropertyTransferRecord"("newOwnerId");

-- CreateIndex
CREATE INDEX "LeaseTemplate_organizationId_isActive_idx" ON "LeaseTemplate"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "LeaseTemplate_propertyId_idx" ON "LeaseTemplate"("propertyId");

-- CreateIndex
CREATE INDEX "LeaseTemplate_unitId_idx" ON "LeaseTemplate"("unitId");

-- CreateIndex
CREATE INDEX "MoveScoreRecord_propertyId_idx" ON "MoveScoreRecord"("propertyId");

-- CreateIndex
CREATE INDEX "MoveScoreRecord_unitId_idx" ON "MoveScoreRecord"("unitId");

-- CreateIndex
CREATE INDEX "MoveScoreRecord_score_idx" ON "MoveScoreRecord"("score");

-- CreateIndex
CREATE INDEX "LiveIntelligenceSnapshot_organizationId_snapshotType_idx" ON "LiveIntelligenceSnapshot"("organizationId", "snapshotType");

-- CreateIndex
CREATE INDEX "LiveIntelligenceSnapshot_generatedAt_idx" ON "LiveIntelligenceSnapshot"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RentScoreRecord_tenantId_key" ON "RentScoreRecord"("tenantId");

-- CreateIndex
CREATE INDEX "RentScoreRecord_tenantId_idx" ON "RentScoreRecord"("tenantId");

-- CreateIndex
CREATE INDEX "RentScoreRecord_score_idx" ON "RentScoreRecord"("score");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceNumber_complianceId_key" ON "ComplianceNumber"("complianceId");

-- CreateIndex
CREATE INDEX "ComplianceNumber_organizationId_idx" ON "ComplianceNumber"("organizationId");

-- CreateIndex
CREATE INDEX "ComplianceNumber_tenantId_idx" ON "ComplianceNumber"("tenantId");

-- CreateIndex
CREATE INDEX "ComplianceNumber_status_idx" ON "ComplianceNumber"("status");

-- CreateIndex
CREATE INDEX "ComplianceNumber_complianceId_idx" ON "ComplianceNumber"("complianceId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_complianceNumberId_idx" ON "ComplianceRecord"("complianceNumberId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_recordType_status_idx" ON "ComplianceRecord"("recordType", "status");

-- CreateIndex
CREATE INDEX "MicroBehaviorRecord_tenantId_idx" ON "MicroBehaviorRecord"("tenantId");

-- CreateIndex
CREATE INDEX "MicroBehaviorRecord_behaviorType_detectedAt_idx" ON "MicroBehaviorRecord"("behaviorType", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QrApplication_qrToken_key" ON "QrApplication"("qrToken");

-- CreateIndex
CREATE INDEX "QrApplication_listingId_idx" ON "QrApplication"("listingId");

-- CreateIndex
CREATE INDEX "QrApplication_unitId_idx" ON "QrApplication"("unitId");

-- CreateIndex
CREATE INDEX "QrApplication_status_idx" ON "QrApplication"("status");

-- CreateIndex
CREATE INDEX "QrAccessLog_qrToken_idx" ON "QrAccessLog"("qrToken");

-- CreateIndex
CREATE INDEX "QrAccessLog_userId_idx" ON "QrAccessLog"("userId");

-- CreateIndex
CREATE INDEX "QrAccessLog_visitorId_idx" ON "QrAccessLog"("visitorId");

-- CreateIndex
CREATE INDEX "QrAccessLog_accessedAt_idx" ON "QrAccessLog"("accessedAt");

-- CreateIndex
CREATE INDEX "Visitor_organizationId_idx" ON "Visitor"("organizationId");

-- CreateIndex
CREATE INDEX "Visitor_propertyId_idx" ON "Visitor"("propertyId");

-- CreateIndex
CREATE INDEX "Visitor_unitId_idx" ON "Visitor"("unitId");

-- CreateIndex
CREATE INDEX "Visitor_phone_idx" ON "Visitor"("phone");

-- CreateIndex
CREATE INDEX "VisitorLog_visitorId_checkInAt_idx" ON "VisitorLog"("visitorId", "checkInAt");

-- CreateIndex
CREATE INDEX "VisitorLog_propertyId_checkInAt_idx" ON "VisitorLog"("propertyId", "checkInAt");

-- CreateIndex
CREATE INDEX "VisitorLog_unitId_approvalStatus_idx" ON "VisitorLog"("unitId", "approvalStatus");

-- CreateIndex
CREATE INDEX "VisitorLog_approvalStatus_idx" ON "VisitorLog"("approvalStatus");

-- CreateIndex
CREATE INDEX "DepositTransfer_outgoingTenantId_status_idx" ON "DepositTransfer"("outgoingTenantId", "status");

-- CreateIndex
CREATE INDEX "DepositTransfer_unitId_status_idx" ON "DepositTransfer"("unitId", "status");

-- CreateIndex
CREATE INDEX "DepositTransfer_status_expiresAt_idx" ON "DepositTransfer"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerManager" ADD CONSTRAINT "ContainerManager_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContainerManager" ADD CONSTRAINT "ContainerManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacatingNotice" ADD CONSTRAINT "VacatingNotice_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacatingNotice" ADD CONSTRAINT "VacatingNotice_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveOutInspection" ADD CONSTRAINT "MoveOutInspection_vacatingNoticeId_fkey" FOREIGN KEY ("vacatingNoticeId") REFERENCES "VacatingNotice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionDeduction" ADD CONSTRAINT "InspectionDeduction_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "MoveOutInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRefund" ADD CONSTRAINT "DepositRefund_vacatingNoticeId_fkey" FOREIGN KEY ("vacatingNoticeId") REFERENCES "VacatingNotice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantChecklist" ADD CONSTRAINT "TenantChecklist_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantChecklist" ADD CONSTRAINT "TenantChecklist_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantChecklist" ADD CONSTRAINT "TenantChecklist_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantChecklistEntry" ADD CONSTRAINT "TenantChecklistEntry_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "TenantChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApplication" ADD CONSTRAINT "RentalApplication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleContext" ADD CONSTRAINT "UserRoleContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceEnquiry" ADD CONSTRAINT "ServiceEnquiry_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortStayProperty" ADD CONSTRAINT "ShortStayProperty_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortStayBooking" ADD CONSTRAINT "ShortStayBooking_shortStayId_fkey" FOREIGN KEY ("shortStayId") REFERENCES "ShortStayProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_shortStayId_fkey" FOREIGN KEY ("shortStayId") REFERENCES "ShortStayProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStockUsage" ADD CONSTRAINT "BookingStockUsage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ShortStayBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStockUsage" ADD CONSTRAINT "BookingStockUsage_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestEvidence" ADD CONSTRAINT "ServiceRequestEvidence_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundHold" ADD CONSTRAINT "FundHold_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentInvoice" ADD CONSTRAINT "RentInvoice_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiSession" ADD CONSTRAINT "ApiSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyRoleAssignment" ADD CONSTRAINT "PropertyRoleAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestHistory" ADD CONSTRAINT "ServiceRequestHistory_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestAssignment" ADD CONSTRAINT "ServiceRequestAssignment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestEscalation" ADD CONSTRAINT "ServiceRequestEscalation_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestQuote" ADD CONSTRAINT "ServiceRequestQuote_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderAuditLog" ADD CONSTRAINT "ServiceProviderAuditLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderPerformance" ADD CONSTRAINT "ServiceProviderPerformance_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "ApplicationCustomFieldValue" ADD CONSTRAINT "ApplicationCustomFieldValue_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCustomFieldValue" ADD CONSTRAINT "ApplicationCustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "ApplicationCustomField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvidence" ADD CONSTRAINT "ApplicationEvidence_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyOnboardingConfig" ADD CONSTRAINT "PropertyOnboardingConfig_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherCharge" ADD CONSTRAINT "OtherCharge_shortStayId_fkey" FOREIGN KEY ("shortStayId") REFERENCES "ShortStayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherCharge" ADD CONSTRAINT "OtherCharge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ShortStayBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTransferRecord" ADD CONSTRAINT "PropertyTransferRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_complianceNumberId_fkey" FOREIGN KEY ("complianceNumberId") REFERENCES "ComplianceNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrApplication" ADD CONSTRAINT "QrApplication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;


