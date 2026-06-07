import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];
  const isGlobal = actor.permissions.includes("*");

  const orgFilter = isGlobal
    ? (organizationId ? { organizationId } : {})
    : { organizationId: { in: actor.orgIds } };

  const invoiceOrgFilter = isGlobal
    ? (organizationId ? { Lease: { organizationId } } : { Lease: {} })
    : { Lease: { organizationId: { in: actor.orgIds } } };

  const [propertiesCount, unitsTotal, unitsOccupied, unitsVacant, activeLeases, paidInvoices, overdueInvoices, maintenanceCount] = await Promise.all([
    prisma.property.count({ where: orgFilter }).catch(() => 0),
    prisma.unit.count({ where: orgFilter }).catch(() => 0),
    prisma.unit.count({ where: { ...orgFilter, status: "OCCUPIED" } }).catch(() => 0),
    prisma.unit.count({ where: { ...orgFilter, status: "VACANT" } }).catch(() => 0),
    prisma.lease.count({ where: { ...orgFilter, status: "active" } }).catch(() => 0),
    prisma.rentInvoice.aggregate({
      where: { ...invoiceOrgFilter, status: "paid" },
      _sum: { amountPaidKes: true },
    }).catch(() => ({ _sum: { amountPaidKes: 0 } })),
    prisma.rentInvoice.aggregate({
      where: { ...invoiceOrgFilter, status: { in: ["pending", "overdue"] } },
      _sum: { balanceKes: true },
    }).catch(() => ({ _sum: { balanceKes: 0 } })),
    prisma.serviceRequest.count({ where: orgFilter }).catch(() => 0),
  ]);

  return Response.json({
    data: {
      propertiesCount,
      unitsTotal,
      unitsOccupied,
      unitsVacant,
      activeTenantsCount: activeLeases,
      rentCollectedKes: Number(paidInvoices._sum.amountPaidKes ?? 0),
      rentOverdueKes: Number(overdueInvoices._sum.balanceKes ?? 0),
      maintenanceRequestsCount: maintenanceCount,
    },
  });
});
