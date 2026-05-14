import { parseAuthToken } from "@/lib/server/token";

export type ApiActor = {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  branchIds: string[];
  orgIds: string[];
};

export function actorFromAuthorizationHeader(authHeader: string | null): ApiActor | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const claims = parseAuthToken(token);
  if (!claims) return null;
  return {
    userId: claims.userId,
    email: claims.email,
    role: claims.role,
    permissions: claims.permissions,
    branchIds: claims.branchIds,
    orgIds: claims.orgIds,
  };
}

function isSuperAdmin(actor: ApiActor): boolean {
  return actor.role === "super_admin" || actor.permissions.includes("*");
}

export function hasPermission(actor: ApiActor, permission: string): boolean {
  return isSuperAdmin(actor) || actor.permissions.includes(permission);
}

export function canAccessBranch(actor: ApiActor, branchId: string): boolean {
  return isSuperAdmin(actor) || actor.branchIds.includes(branchId);
}

export function canAccessOrg(actor: ApiActor, orgId: string): boolean {
  return isSuperAdmin(actor) || actor.orgIds.includes(orgId);
}
