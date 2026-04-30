import type { AuthUser, RoleAssignmentSummary, UserProfileFields, UserRole } from "@/types/auth";
import type {
  PlatformRoleSlug,
  ProfileMockDataset,
  UserRoleAssignment,
} from "@/types/profile-system";
import { profileMockDataset } from "@/lib/profile-mock-data";

function roleSlugById(dataset: ProfileMockDataset, roleId: string): PlatformRoleSlug {
  const row = dataset.roles.find((r) => r.id === roleId);
  if (!row) throw new Error(`Unknown roleId: ${roleId}`);
  return row.slug;
}

function activeAssignmentsForUser(
  dataset: ProfileMockDataset,
  userId: string
): UserRoleAssignment[] {
  return dataset.userRoles.filter(
    (ur) => ur.userId === userId && ur.status === "active"
  );
}

function assignmentLabel(slug: PlatformRoleSlug, dataset: ProfileMockDataset): string {
  return dataset.roles.find((r) => r.slug === slug)?.displayName ?? slug;
}

function attrsForUser(
  dataset: ProfileMockDataset,
  userId: string,
  userRoleId: string | undefined
): Map<string, string> {
  const map = new Map<string, string>();
  for (const a of dataset.profileAttributes) {
    if (a.userId !== userId) continue;
    if (a.userRoleId != null && a.userRoleId !== userRoleId) continue;
    if (a.valueText != null) map.set(`${a.namespace}.${a.key}`, a.valueText);
  }
  return map;
}

function pickExtensionFields(
  dataset: ProfileMockDataset,
  ur: UserRoleAssignment,
  slug: PlatformRoleSlug
): Partial<UserProfileFields> & Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};

  if (slug === "landlord") {
    const row = dataset.landlordProfiles.find((p) => p.userRoleId === ur.id);
    if (row) {
      out.companyOrPortfolioName = row.companyName;
      out.taxPin = row.taxPin;
    }
  }

  if (slug === "professional") {
    const row = dataset.professionalProfiles.find((p) => p.userRoleId === ur.id);
    if (row?.headline) out.bio = row.headline;
  }

  if (slug === "service_provider") {
    const row = dataset.serviceProviderProfiles.find((p) => p.userRoleId === ur.id);
    if (row?.businessLegalName) out.companyOrPortfolioName = row.businessLegalName;
  }

  return out;
}

/** Map platform slug to session role (legacy admin → super_admin). */
export function normalizeSessionRole(role: UserRole): UserRole {
  if (role === "admin") return "super_admin";
  return role;
}

export function isPlatformAdminRole(role: UserRole): boolean {
  const r = normalizeSessionRole(role);
  return r === "super_admin";
}

function baseProfileFields(
  dataset: ProfileMockDataset,
  userId: string
): Partial<UserProfileFields> & { name: string } {
  const bp = dataset.profiles.find((p) => p.userId === userId);
  if (!bp) return { name: "User" };

  const globalAttrs = attrsForUser(dataset, userId, undefined);
  const whatsapp =
    globalAttrs.get("preferences.whatsapp_number") ?? bp.phone;
  const currency = globalAttrs.get("preferences.preferred_currency");
  const lang = globalAttrs.get("preferences.preferred_language");

  let emergencyName: string | undefined;
  let emergencyPhone: string | undefined;
  const emergency = dataset.profileAttributes.find(
    (a) =>
      a.userId === userId &&
      !a.userRoleId &&
      a.namespace === "emergency" &&
      a.key === "contact" &&
      a.valueJson
  );
  if (emergency?.valueJson) {
    const j = emergency.valueJson as { name?: string; phone?: string };
    emergencyName = j.name;
    emergencyPhone = j.phone;
  }

  return {
    name: bp.displayName,
    avatarUrl: bp.avatarUrl,
    phone: bp.phone,
    whatsappNumber: whatsapp,
    city: bp.city,
    country: bp.country,
    timezone: bp.timezone,
    preferredCurrency: currency,
    preferredLanguage: lang,
    mailingAddress: bp.mailingAddress,
    bio: bp.bio,
    emergencyContactName: emergencyName,
    emergencyContactPhone: emergencyPhone,
  };
}

export type MergeAuthUserOptions = {
  dataset?: ProfileMockDataset;
  activeUserRoleId?: string | null;
};

/**
 * Builds `AuthUser` from identity id + profile dataset (mirrors GET /v1/me merged profile).
 */
export function mergeAuthUserFromDataset(
  userId: string,
  email: string,
  options: MergeAuthUserOptions = {}
): AuthUser | null {
  const dataset = options.dataset ?? profileMockDataset;
  const identity = dataset.users.find((u) => u.id === userId);
  if (!identity) return null;

  const assignments = activeAssignmentsForUser(dataset, userId);
  if (assignments.length === 0) return null;

  const byId = options.activeUserRoleId
    ? assignments.find((a) => a.id === options.activeUserRoleId)
    : undefined;
  const activeUr = byId ?? assignments[0];
  if (!activeUr) return null;

  const slug = roleSlugById(dataset, activeUr.roleId);
  const sessionRole: UserRole = slug;

  const base = baseProfileFields(dataset, userId);
  const roleScopedAttrs = attrsForUser(dataset, userId, activeUr.id);
  const ext = pickExtensionFields(dataset, activeUr, slug);

  const mergedBio =
    slug === "professional" && ext.bio != null
      ? ext.bio
      : base.bio;

  const mergedCompany =
    ext.companyOrPortfolioName ?? base.companyOrPortfolioName;

  const roleAssignments: RoleAssignmentSummary[] = assignments.map((ur) => {
    const s = roleSlugById(dataset, ur.roleId);
    return {
      id: ur.id,
      roleSlug: s,
      organizationId: ur.organizationId ?? "",
      branchId: ur.branchId ?? "",
      label: assignmentLabel(s, dataset),
    };
  });

  const preferredCurrency =
    roleScopedAttrs.get("preferences.preferred_currency") ??
    base.preferredCurrency;

  const user: AuthUser = {
    id: userId,
    email,
    name: base.name,
    role: sessionRole,
    organizationId: activeUr.organizationId ?? "",
    branchId: activeUr.branchId ?? "",
    permissions: activeUr.permissions,
    activeUserRoleId: activeUr.id,
    roleAssignments,
    phone: base.phone,
    whatsappNumber: base.whatsappNumber,
    city: base.city,
    country: base.country,
    timezone: base.timezone,
    preferredCurrency,
    preferredLanguage: base.preferredLanguage,
    avatarUrl: base.avatarUrl,
    companyOrPortfolioName: mergedCompany,
    taxPin: ext.taxPin,
    mailingAddress: base.mailingAddress,
    emergencyContactName: base.emergencyContactName,
    emergencyContactPhone: base.emergencyContactPhone,
    bio: mergedBio,
    nationalIdLast4: ext.nationalIdLast4,
  };

  return user;
}

export function findSeedUserIdByEmail(
  email: string,
  dataset: ProfileMockDataset = profileMockDataset
): string | null {
  const normalized = email.trim().toLowerCase();
  const u = dataset.users.find((x) => x.email.toLowerCase() === normalized);
  return u?.id ?? null;
}

export function authUserFromSeedEmail(
  email: string,
  activeUserRoleId?: string | null
): AuthUser | null {
  const userId = findSeedUserIdByEmail(email);
  if (!userId) return null;
  const identity = profileMockDataset.users.find((u) => u.id === userId);
  if (!identity) return null;
  return mergeAuthUserFromDataset(userId, identity.email, { activeUserRoleId });
}

/**
 * Synthetic registration: single role assignment for users not in the seed dataset.
 */
export function syntheticAuthUser(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  branchId: string;
  permissions: string[];
  avatarUrl?: string;
  phone?: string;
  whatsappNumber?: string;
  country?: string;
  timezone?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}): AuthUser {
  const slug = normalizeSessionRole(input.role);
  const urId = `ur_synth_${input.id}_${slug}`;
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: slug,
    organizationId: input.organizationId,
    branchId: input.branchId,
    permissions: input.permissions,
    avatarUrl: input.avatarUrl,
    activeUserRoleId: urId,
    roleAssignments: [
      {
        id: urId,
        roleSlug: slug,
        organizationId: input.organizationId,
        branchId: input.branchId,
        label: assignmentLabel(slug as PlatformRoleSlug, profileMockDataset),
      },
    ],
    phone: input.phone,
    whatsappNumber: input.whatsappNumber,
    country: input.country,
    timezone: input.timezone,
    preferredCurrency: input.preferredCurrency,
    preferredLanguage: input.preferredLanguage,
  };
}

export function switchActiveRole(
  user: AuthUser,
  roleSlug: UserRole
): AuthUser | null {
  const target = normalizeSessionRole(roleSlug);
  const match = user.roleAssignments?.find((a) => a.roleSlug === target);
  if (!match) return null;
  const seed = findSeedUserIdByEmail(user.email);
  if (seed) {
    return mergeAuthUserFromDataset(user.id, user.email, {
      activeUserRoleId: match.id,
    });
  }
  return {
    ...user,
    role: target,
    organizationId: match.organizationId,
    branchId: match.branchId,
    activeUserRoleId: match.id,
  };
}
