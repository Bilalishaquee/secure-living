import { prisma } from "@/lib/server/db";
import type { ApiActor } from "@/lib/server/authz";

/**
 * Property Manager scoping (UPDATE.md "Support Module Restructure Specification" RBAC:
 * "Property Manager — Assigned properties only"). Super admins and org-wide roles
 * (admin/landlord/agency/staff) are NOT scoped by this — only the "manager" PropertyRoleAssignment
 * roleType is. Returns null when the actor is not scoped to specific properties (i.e. should
 * see everything their org-level permissions already allow).
 */
export async function assignedPropertyIdsIfManager(actor: ApiActor): Promise<string[] | null> {
  const isPropertyManager = actor.role === "manager" || actor.role === "property_manager";
  if (!isPropertyManager) return null;

  const assignments = await prisma.propertyRoleAssignment.findMany({
    where: { userId: actor.userId, roleType: "manager" },
    select: { propertyId: true },
  });
  return assignments.map((a) => a.propertyId);
}
