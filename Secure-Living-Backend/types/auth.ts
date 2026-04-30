import type { PlatformRoleSlug } from "@/types/profile-system";

/**
 * Session / navigation role. `admin` is legacy alias for stored sessions only;
 * new data uses `super_admin`.
 */
export type UserRole = PlatformRoleSlug | "admin";

export type RegisterableRole = "landlord" | "tenant" | "professional" | "staff";

export type RoleAssignmentSummary = {
  id: string;
  roleSlug: UserRole;
  organizationId: string;
  branchId: string;
  label: string;
};

/** Extended profile fields (settings / UI). All optional for backward compatibility. */
export type UserProfileFields = {
  avatarUrl?: string;
  phone?: string;
  whatsappNumber?: string;
  city?: string;
  country?: string;
  timezone?: string;
  preferredCurrency?: string;
  companyOrPortfolioName?: string;
  taxPin?: string;
  mailingAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bio?: string;
  dateOfBirth?: string;
  nationalIdLast4?: string;
  preferredLanguage?: string;
};

export type AuthUser = UserProfileFields & {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  branchId: string;
  permissions: string[];
  /** Active `user_roles.id` from profile architecture (multi-role). */
  activeUserRoleId?: string;
  roleAssignments?: RoleAssignmentSummary[];
};

export const AUTH_STORAGE_KEY = "sl_auth_user" as const;
