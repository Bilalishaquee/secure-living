import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

// Groups unlinked imported PastRentRecord rows by their raw legacy unitId, so the
// landlord links each distinct legacy unit once rather than record-by-record.
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "leases:manage");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  const rows = await prisma.pastRentRecord.findMany({
    where: { organizationId: orgId, linkStatus: "unlinked" },
    select: { unitId: true, tenantId: true, propertyId: true, periodYear: true, periodMonth: true },
    orderBy: { unitId: "asc" },
  });

  const grouped = new Map<string, { legacyUnitId: string; legacyTenantIds: Set<string>; propertyId: string | null; recordCount: number }>();
  for (const r of rows) {
    const g = grouped.get(r.unitId) ?? { legacyUnitId: r.unitId, legacyTenantIds: new Set<string>(), propertyId: r.propertyId, recordCount: 0 };
    g.legacyTenantIds.add(r.tenantId);
    g.recordCount += 1;
    grouped.set(r.unitId, g);
  }

  const data = Array.from(grouped.values()).map((g) => ({
    legacyUnitId: g.legacyUnitId,
    legacyTenantIds: Array.from(g.legacyTenantIds),
    propertyId: g.propertyId,
    recordCount: g.recordCount,
  }));

  return Response.json({ data });
});
