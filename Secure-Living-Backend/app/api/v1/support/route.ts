import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";
import { assignedPropertyIdsIfManager } from "@/lib/server/property-scope";

// RBAC (UPDATE.md "Support Module Restructure Specification"): Super Admin — all;
// Admin/Landlord/Agency/Staff — organization-specific only; Property Manager — assigned
// properties only; Tenant — no access (the tenant role is not granted support:view; they
// use service-request "My Requests" instead).
//
// SupportTicket and ContactRequest aren't tied to a property (a "cannot log in" ticket or
// a website contact form submission has no property context) — for these two, a Property
// Manager's "assigned properties only" scope is applied as "assigned to me", since that's
// the closest meaningful equivalent for property-scoped visibility on non-property records.
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "support:view");
  if (denied) return denied;

  const url = new URL(req.url);
  const module = url.searchParams.get("module") ?? "tickets";
  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  const orgWhere = isGlobal ? {} : { organizationId: { in: actor.orgIds } };
  const managerPropertyIds = await assignedPropertyIdsIfManager(actor);
  const managerOnlyMineWhere = managerPropertyIds ? { assignedTo: actor.userId } : {};

  if (module === "contacts") {
    const rows = await prisma.contactRequest.findMany({
      where: { ...orgWhere, ...managerOnlyMineWhere },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ data: rows });
  }

  if (module === "leads") {
    const rows = await prisma.crmLead.findMany({
      where: orgWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ data: rows });
  }

  const rows = await prisma.supportTicket.findMany({
    where: { ...orgWhere, ...managerOnlyMineWhere },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ data: rows });
});
