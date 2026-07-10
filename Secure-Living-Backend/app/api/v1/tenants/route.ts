import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

// Tenants list — must show every tenant account in the org, not just ones with a lease
// already attached (bug: creating a tenant via /tenants/new only creates the account; a
// lease is a separate, later step, so a lease-only query was silently hiding brand-new
// tenants until someone leased them to a unit).
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "tenant:view");
  if (denied) return denied;

  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");

  const assignments = await prisma.userRoleAssignment.findMany({
    where: {
      status: "active",
      role: { slug: "tenant" },
      ...(isGlobal ? {} : { organizationId: { in: actor.orgIds } }),
    },
    include: { user: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  // De-dupe (a tenant could theoretically have >1 active assignment) keeping the newest.
  const byUserId = new Map<string, (typeof assignments)[number]>();
  for (const a of assignments) if (!byUserId.has(a.userId)) byUserId.set(a.userId, a);
  const tenantUserIds = Array.from(byUserId.keys());

  const leases = tenantUserIds.length
    ? await prisma.lease.findMany({
        where: { tenantUserId: { in: tenantUserIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  // One lease per tenant for the list view — prefer active, else the most recent of any status.
  const leaseByTenant = new Map<string, (typeof leases)[number]>();
  for (const lease of leases) {
    const existing = leaseByTenant.get(lease.tenantUserId);
    if (!existing || (lease.status === "active" && existing.status !== "active")) {
      leaseByTenant.set(lease.tenantUserId, lease);
    }
  }

  const propertyIds = Array.from(new Set(leases.map((l) => l.propertyId).filter((id): id is string => Boolean(id))));
  const unitIds = Array.from(new Set(leases.map((l) => l.unitId).filter((id): id is string => Boolean(id))));
  const [properties, units] = await Promise.all([
    propertyIds.length ? prisma.property.findMany({ where: { id: { in: propertyIds } }, select: { id: true, name: true } }) : [],
    unitIds.length ? prisma.unit.findMany({ where: { id: { in: unitIds } }, select: { id: true, unitNumber: true } }) : [],
  ]);
  const propertyMap = new Map(properties.map((p) => [p.id, p.name]));
  const unitMap = new Map(units.map((u) => [u.id, u.unitNumber]));

  const leaseIds = leases.map((l) => l.id);
  const overdueInvoices = leaseIds.length
    ? await prisma.rentInvoice.findMany({
        where: { leaseId: { in: leaseIds }, status: { in: ["pending", "overdue"] }, dueDate: { lt: new Date() } },
        select: { leaseId: true, balanceKes: true },
      })
    : [];
  const arrearsByLease = new Map<string, number>();
  for (const inv of overdueInvoices) {
    arrearsByLease.set(inv.leaseId, (arrearsByLease.get(inv.leaseId) ?? 0) + inv.balanceKes);
  }

  const data = tenantUserIds.map((userId) => {
    const assignment = byUserId.get(userId)!;
    const lease = leaseByTenant.get(userId) ?? null;
    return {
      tenantUserId: userId,
      name: assignment.user.fullName,
      email: assignment.user.email,
      phone: assignment.user.phone,
      createdAt: assignment.user.createdAt,
      leaseId: lease?.id ?? null,
      leaseStatus: lease?.status ?? null,
      propertyId: lease?.propertyId ?? null,
      unitId: lease?.unitId ?? null,
      propertyName: lease ? propertyMap.get(lease.propertyId) ?? null : null,
      unitNumber: lease ? unitMap.get(lease.unitId) ?? null : null,
      rentAmount: lease?.rentAmount ?? null,
      leaseEndDate: lease?.endDate ?? null,
      arrearsKes: lease ? arrearsByLease.get(lease.id) ?? 0 : 0,
    };
  });

  return Response.json({ data });
});
