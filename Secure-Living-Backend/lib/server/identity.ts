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
  const permissions = Array.from(
    new Set(assignments.flatMap((a) => a.role.permissions.map((p) => p.permission.code)))
  );
  const branchIds = Array.from(new Set(assignments.map((a) => a.branchId)));
  const orgIds = Array.from(new Set(assignments.map((a) => a.organizationId)));
  return { role, permissions, branchIds, orgIds };
}
