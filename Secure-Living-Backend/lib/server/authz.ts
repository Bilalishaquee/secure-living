import { parseAuthToken } from "@/lib/server/token";

export type ApiActor = {
  userId: string;
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
    role: claims.role,
    permissions: claims.permissions,
    branchIds: claims.branchIds,
    orgIds: claims.orgIds,
  };
}

export function hasPermission(actor: ApiActor, permission: string): boolean {
  return actor.permissions.includes("*") || actor.permissions.includes(permission);
}

export function canAccessBranch(actor: ApiActor, branchId: string): boolean {
  return actor.permissions.includes("*") || actor.branchIds.includes(branchId);
}

export function canAccessOrg(actor: ApiActor, orgId: string): boolean {
  return actor.permissions.includes("*") || actor.orgIds.includes(orgId);
}
