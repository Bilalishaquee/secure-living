import { prisma } from "@/lib/server/db";

export async function buildUserAccess(userId: string) {
  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId, status: "active" },
    include: {
      organization: true,
      branch: true,
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
  const isSuperAdmin = assignments.some((a) => a.role.slug === "super_admin");
  const operationalAssignments = isSuperAdmin
    ? assignments
    : assignments.filter((a) => a.organization.status === "active" && a.branch.status === "active");

  const role = assignments[0]?.role.slug ?? "staff";
  let permissions = Array.from(
    new Set(operationalAssignments.flatMap((a) => a.role.permissions.map((p) => p.permission.code)))
  );

  // super_admin always has wildcard access — guard against missing DB rows
  if (role === "super_admin" && !permissions.includes("*")) {
    permissions = ["*"];
    console.warn(`[buildUserAccess] super_admin userId=${userId} had no RolePermission rows — applying wildcard fallback. Run: node scripts/repair-permissions.mjs`);
  } else if (permissions.length === 0) {
    console.warn(`[buildUserAccess] userId=${userId} role=${role} has ${assignments.length} assignment(s) but 0 permissions — RolePermission links may be missing. Run: node scripts/repair-permissions.mjs`);
  }

  const branchIds = Array.from(new Set(operationalAssignments.map((a) => a.branchId)));
  const orgIds = Array.from(new Set(operationalAssignments.map((a) => a.organizationId)));
  return { role, permissions, branchIds, orgIds };
}
