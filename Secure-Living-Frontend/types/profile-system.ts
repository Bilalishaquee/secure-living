/**
 * Phase 1 profile architecture — domain types (mirrors future DB tables).
 * Mock data + merge layer use these shapes; API layer will reuse the same names.
 */

export type UserStatus = "active" | "suspended" | "deleted";

/** Canonical role slugs (matches `roles.slug`). */
export type PlatformRoleSlug =
  | "super_admin"
  | "supervisor"
  | "staff"
  | "landlord"
  | "tenant"
  | "buyer"
  | "seller"
  | "professional"
  | "service_provider"
  | "external_client";

export type RoleRow = {
  id: string;
  slug: PlatformRoleSlug;
  displayName: string;
  isInternal: boolean;
  isPublicDirectoryEligible: boolean;
  sortOrder: number;
};

export type UserRoleStatus = "active" | "revoked";

/** `users` table */
export type IdentityUser = {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: string;
};

/** `user_roles` — one row per role assignment (supports multi-role + scope). */
export type UserRoleAssignment = {
  id: string;
  userId: string;
  roleId: string;
  organizationId: string | null;
  branchId: string | null;
  status: UserRoleStatus;
  permissions: string[];
  assignedAt: string;
};

/** `profiles` — shared person-level data (1:1 users). */
export type BaseProfile = {
  userId: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  avatarUrl?: string;
  locale?: string;
  timezone?: string;
  phone?: string;
  city?: string;
  country?: string;
  mailingAddress?: string;
  bio?: string;
};

/** `landlord_profiles` — 1:1 with landlord `user_roles` row */
export type LandlordProfileExtension = {
  userRoleId: string;
  userId: string;
  companyName?: string;
  taxPin?: string;
  defaultPortfolioId?: string;
};

/** `tenant_profiles` */
export type TenantProfileExtension = {
  userRoleId: string;
  userId: string;
  kycTier?: string;
  currentLeaseId?: string | null;
};

/** `staff_profiles` (staff / supervisor / super_admin internal metadata) */
export type StaffProfileExtension = {
  userRoleId: string;
  userId: string;
  employeeId?: string;
  department?: string;
  jobTitle?: string;
  reportsToUserId?: string | null;
};

/** `professional_profiles` */
export type ProfessionalProfileExtension = {
  userRoleId: string;
  userId: string;
  publicSlug: string;
  headline?: string;
  isPublic: boolean;
  verificationStatus?: "none" | "pending" | "verified";
  yearsExperience?: number;
};

/** `service_provider_profiles` */
export type ServiceProviderProfileExtension = {
  userRoleId: string;
  userId: string;
  businessLegalName?: string;
  registrationNumber?: string;
  publicSlug: string;
  isPublic: boolean;
  primaryContactUserId?: string;
};

/** `external_client_profiles` */
export type ExternalClientProfileExtension = {
  userRoleId: string;
  userId: string;
  relationshipType?: string;
  referralSource?: string;
};

/** `buyer_profiles` */
export type BuyerProfileExtension = {
  userRoleId: string;
  userId: string;
  searchBrief?: string;
  agentUserId?: string | null;
};

/** `seller_profiles` */
export type SellerProfileExtension = {
  userRoleId: string;
  userId: string;
  listingPreferences?: string;
};

/** `profile_attributes` — namespaced EAV-style flexibility */
export type ProfileAttribute = {
  id: string;
  userId: string;
  userRoleId?: string | null;
  namespace: string;
  key: string;
  valueText?: string;
  valueJson?: Record<string, unknown>;
  updatedAt: string;
};

export type ProfileMockDataset = {
  roles: RoleRow[];
  users: IdentityUser[];
  userRoles: UserRoleAssignment[];
  profiles: BaseProfile[];
  landlordProfiles: LandlordProfileExtension[];
  tenantProfiles: TenantProfileExtension[];
  staffProfiles: StaffProfileExtension[];
  professionalProfiles: ProfessionalProfileExtension[];
  serviceProviderProfiles: ServiceProviderProfileExtension[];
  externalClientProfiles: ExternalClientProfileExtension[];
  buyerProfiles: BuyerProfileExtension[];
  sellerProfiles: SellerProfileExtension[];
  profileAttributes: ProfileAttribute[];
};
