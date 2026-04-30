import { z } from "zod";

export const createServiceRequestSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantUserId: z.string().optional(),
  title: z.string().min(3).max(160),
  description: z.string().min(5).max(5000),
  type: z.enum(["maintenance", "inspection", "proxy", "legal"]).default("maintenance"),
  category: z.enum(["plumbing", "electrical", "security", "cleaning", "inspection", "legal", "proxy", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const updateServiceRequestSchema = z.object({
  status: z.enum(["draft", "approved", "in_progress", "escalated", "completed", "cancelled"]).optional(),
  assignedToUserId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  escalatedReason: z.string().max(500).optional(),
});

export const createLeaseSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  tenantUserId: z.string().min(1),
  leaseType: z.enum(["fixed_term", "month_to_month"]),
  rentAmount: z.number().positive(),
  depositAmount: z.number().nonnegative().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  paymentFrequency: z.enum(["monthly", "quarterly"]),
});

export const updateLeaseSchema = z.object({
  status: z.enum(["draft", "active", "terminated", "expired"]).optional(),
  signedAt: z.string().datetime().optional(),
  terminatedAt: z.string().datetime().optional(),
});

export const createProfessionalSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().optional(),
  branchId: z.string().optional(),
  profession: z.string().min(2),
  skills: z.array(z.string().min(1)).min(1),
  verificationStatus: z.enum(["pending", "verified", "rejected"]).default("pending"),
  bio: z.string().max(500).optional(),
});

export const createJobAssignmentSchema = z.object({
  serviceRequestId: z.string().min(1),
  professionalUserId: z.string().min(1),
  quotedAmount: z.number().nonnegative().optional(),
  agreedAmount: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});

export const createUnitSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  propertyId: z.string().min(1),
  unitNumber: z.string().min(1),
  floor: z.string().optional(),
  unitType: z.string().min(1),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  sizeSqft: z.number().positive().optional(),
  rentAmountKes: z.number().nonnegative().optional(),
  depositAmountKes: z.number().nonnegative().optional(),
  isFurnished: z.boolean().optional(),
  amenities: z.array(z.string().min(1)).optional(),
  category: z.enum(["residential", "commercial", "industrial"]).optional(),
  parkingBay: z.string().optional(),
  specialNotes: z.string().max(500).optional(),
  status: z.enum(["vacant", "occupied", "under_maintenance", "reserved", "unavailable"]),
  currentTenantId: z.string().optional(),
  currentLeaseId: z.string().optional(),
});

export const createWalletSchema = z.object({
  ownerId: z.string().min(1),
  ownerType: z.enum(["user", "property", "organization"]),
  walletType: z.enum(["user_wallet", "property_wallet", "escrow_wallet", "reserve_wallet", "operating_wallet"]),
  currency: z.string().default("KES"),
  isFrozen: z.boolean().optional(),
});

export const createTransactionSchema = z.object({
  organizationId: z.string().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  fromWalletId: z.string().optional(),
  toWalletId: z.string().optional(),
  amountKes: z.number().positive(),
  feeKes: z.number().nonnegative().optional(),
  transactionType: z.enum([
    "rent_payment",
    "deposit",
    "deposit_refund",
    "maintenance_payment",
    "commission",
    "fee",
    "reversal",
    "withdrawal",
    "top_up",
  ]),
  paymentMethod: z.enum([
    "mpesa_stk",
    "mpesa_paybill",
    "mpesa_till",
    "airtel_money",
    "bank_transfer_rtgs",
    "bank_transfer_eft",
    "pesalink",
    "card",
    "cash",
  ]),
  mpesaReference: z.string().optional(),
  bankReference: z.string().optional(),
  idempotencyKey: z.string().optional(),
  status: z.enum(["pending", "completed", "failed"]).default("completed"),
  description: z.string().optional(),
});

export const createEscrowSchema = z.object({
  leaseId: z.string().min(1),
  tenantId: z.string().min(1),
  landlordId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  amountKes: z.number().positive(),
});

export const createRentInvoiceSchema = z.object({
  leaseId: z.string().min(1),
  tenantId: z.string().min(1),
  landlordId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  rentAmountKes: z.number().nonnegative(),
  lateFeeKes: z.number().nonnegative().optional(),
  otherChargesKes: z.number().nonnegative().optional(),
});

export const payRentInvoiceSchema = z.object({
  amountKes: z.number().positive(),
  paymentMethod: z.enum([
    "mpesa_stk",
    "mpesa_paybill",
    "mpesa_till",
    "airtel_money",
    "bank_transfer_rtgs",
    "bank_transfer_eft",
    "pesalink",
    "card",
    "cash",
  ]),
  mpesaReference: z.string().optional(),
});

export const createListingSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(5),
  rentKes: z.number().nonnegative(),
  depositKes: z.number().nonnegative(),
  availableFrom: z.string().datetime().optional(),
  amenities: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  contactMethod: z.string().min(1),
});

export const createTenantApplicationSchema = z.object({
  unitId: z.string().min(1),
  applicantName: z.string().min(2),
  applicantEmail: z.string().email(),
  applicantPhone: z.string().min(7),
  nationalIdNumber: z.string().optional(),
  employerName: z.string().optional(),
  monthlyIncomeKes: z.number().nonnegative().optional(),
  referencesJson: z.record(z.string(), z.any()).optional(),
  motivationLetter: z.string().optional(),
});

export const createPropertySchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  ownerUserId: z.string().optional(),
  managerUserId: z.string().optional(),
  name: z.string().min(2),
  propertyCode: z.string().optional(),
  propertyType: z.enum([
    "Apartment Block",
    "Maisonette",
    "Bungalow",
    "Bedsitter",
    "Studio",
    "Commercial",
    "Mixed Use",
    "Short-Term Rental",
    "Airbnb",
  ]),
  ownershipType: z.enum(["Owned", "Managed (Third Party)", "Joint Ownership", "Company Owned"]).optional(),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("Kenya"),
  postalCode: z.string().optional(),
  gpsLatitude: z.number().min(-90).max(90).optional(),
  gpsLongitude: z.number().min(-180).max(180).optional(),
  landReferenceNumber: z.string().optional(),
  titleDeedNumber: z.string().optional(),
  descriptionNotes: z.string().optional(),
  yearBuilt: z.number().int().gte(1800).lte(3000).optional(),
  totalUnits: z.number().int().nonnegative().optional(),
  totalSqft: z.number().positive().optional(),
  lotSizeSqft: z.number().positive().optional(),
  totalBathrooms: z.number().nonnegative().optional(),
  totalParkingSpaces: z.number().int().nonnegative().optional(),
  purchasePriceKes: z.number().nonnegative().optional(),
  acquisitionDate: z.string().datetime().optional(),
  currentValueKes: z.number().nonnegative().optional(),
  mortgageBalanceKes: z.number().nonnegative().optional(),
  marketRentEstimateKes: z.number().nonnegative().optional(),
  noiEstimateKes: z.number().optional(),
  capRateEstimate: z.number().min(0).max(100).optional(),
  propertyTaxAnnualKes: z.number().nonnegative().optional(),
  insuranceProvider: z.string().optional(),
  insurancePremiumAnnualKes: z.number().nonnegative().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiryDate: z.string().datetime().optional(),
  hoaFeeMonthlyKes: z.number().nonnegative().optional(),
  mortgageLender: z.string().optional(),
  mortgageInterestRate: z.number().min(0).max(100).optional(),
  mortgageLoanTermMonths: z.number().int().positive().optional(),
  mortgageMonthlyPaymentKes: z.number().nonnegative().optional(),
  mortgageStartDate: z.string().datetime().optional(),
  mortgageMaturityDate: z.string().datetime().optional(),
  listingUrl: z.string().url().optional(),
  shortTermRentalPlatform: z.string().optional(),
  tags: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  photos: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  floorPlanUrl: z.string().url().optional(),
  titleDeedScanUrl: z.string().url().optional(),
  category: z.enum(["residential", "commercial", "industrial", "mixed_use"]).default("residential"),
  managementMode: z.enum(["self_managed", "full_service"]).default("self_managed"),
  categoryAttributesJson: z.string().optional(),
  status: z.enum(["active", "inactive", "draft", "archived"]).default("active"),
  propertyRoles: z.array(
    z.object({
      userId: z.string().min(1),
      roleType: z.enum(["owner", "manager", "caretaker"]),
    })
  ).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createExpenseSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  category: z.enum(["mortgage", "insurance", "tax", "maintenance", "utilities", "management_fee", "hoa", "renovation", "other"]),
  description: z.string().min(2),
  amountKes: z.number().positive(),
  date: z.string().datetime(),
  vendorName: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  paymentMethod: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFreq: z.enum(["monthly", "quarterly", "annual"]).optional(),
  notes: z.string().max(500).optional(),
});

export const updateExpenseSchema = z.object({
  category: z.enum(["mortgage", "insurance", "tax", "maintenance", "utilities", "management_fee", "hoa", "renovation", "other"]).optional(),
  description: z.string().min(2).optional(),
  amountKes: z.number().positive().optional(),
  date: z.string().datetime().optional(),
  vendorName: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  paymentMethod: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFreq: z.enum(["monthly", "quarterly", "annual"]).optional(),
  notes: z.string().max(500).optional(),
});

export const createSubscriptionPlanSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  priceKesMonthly: z.number().nonnegative(),
  priceKesAnnual: z.number().nonnegative().optional(),
  featureJson: z.record(z.string(), z.any()),
  isActive: z.boolean().optional(),
});

export const createUserSubscriptionSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().optional(),
  planCode: z.string().min(2),
  status: z.enum(["active", "trialing", "past_due", "canceled"]),
  billingCycle: z.enum(["monthly", "annual"]),
  startedAt: z.string().datetime(),
  nextBillingAt: z.string().datetime().optional(),
});

export const createScreeningReportSchema = z.object({
  applicationId: z.string().min(1),
  applicantName: z.string().min(2),
  nationalIdNumber: z.string().optional(),
  score: z.number().int().min(0).max(1000).optional(),
  recommendation: z.enum(["approve", "review", "decline"]),
  riskFlagsJson: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  status: z.enum(["generated", "reviewed", "finalized"]).default("generated"),
});

export const createDocumentTemplateSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["lease", "notice", "rent", "maintenance", "legal", "other"]),
  jurisdiction: z.string().default("Kenya"),
  templateBody: z.string().min(10),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const createESignRequestSchema = z.object({
  templateId: z.string().optional(),
  leaseId: z.string().optional(),
  title: z.string().min(2),
  documentUrl: z.string().url().optional(),
  signerUserId: z.string().min(1),
  signerEmail: z.string().email(),
  status: z.enum(["draft", "sent", "viewed", "signed", "declined"]).default("draft"),
  sentAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const createReminderScheduleSchema = z.object({
  organizationId: z.string().optional(),
  branchId: z.string().optional(),
  targetType: z.enum(["invoice", "lease", "service_request", "custom"]),
  targetId: z.string().min(1),
  channel: z.enum(["sms", "email", "whatsapp"]),
  scheduleOffsetDays: z.number().int(),
  messageTemplate: z.string().min(3),
  isEnabled: z.boolean().optional(),
});
