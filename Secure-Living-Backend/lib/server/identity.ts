import { prisma } from "@/lib/server/db";

export async function buildUserAccess(userId: string) {
  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId, status: "active" },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
  const role = assignments[0]?.role.slug ?? "staff";
  let permissions = Array.from(
    new Set(assignments.flatMap((a) => a.role.permissions.map((p) => p.permission.code)))
  );

  // super_admin always has wildcard access — guard against missing DB rows
  if (role === "super_admin" && !permissions.includes("*")) {
    permissions = ["*"];
    console.warn(`[buildUserAccess] super_admin userId=${userId} had no RolePermission rows — applying wildcard fallback. Run: node scripts/repair-permissions.mjs`);
  } else if (permissions.length === 0) {
    console.warn(`[buildUserAccess] userId=${userId} role=${role} has ${assignments.length} assignment(s) but 0 permissions — RolePermission links may be missing. Run: node scripts/repair-permissions.mjs`);
  }

  const branchIds = Array.from(new Set(assignments.map((a) => a.branchId)));
  const orgIds = Array.from(new Set(assignments.map((a) => a.organizationId)));
  return { role, permissions, branchIds, orgIds };
}
