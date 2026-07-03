import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

const ACTIVE_SR_STATUSES: SrStatus[] = [
  SrStatus.SUBMITTED,
  SrStatus.APPROVED,
  SrStatus.QUOTING,
  SrStatus.AWAITING_FUNDING,
  SrStatus.FUNDED,
  SrStatus.ASSIGNED,
  SrStatus.SCHEDULING_PENDING,
  SrStatus.IN_PROGRESS,
];

// Same categories of stats as /api/v1/dashboard/stats, scoped to a single property —
// so a landlord can see "the same data shown in the dashboard" for one property (spec:
// "The same data that is shown in the dashboard should also be seen in a single property").
export const GET = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "properties:view");
  if (denied) return denied;

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return jsonError(404, "Property not found");
  const scoped = requireScope(actor, property.organizationId, property.branchId);
  if (scoped) return scoped;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    unitAggregate,
    activeLeases,
    openServiceRequests,
    blockedServiceRequests,
    slaBreachCount,
    monthlyRentInvoices,
    allMonthInvoices,
    overdueInvoices,
    depositFullyCovered,
    depositAtRisk,
    depositShortfall,
    escrowAccounts,
    propertyTenantLeases,
  ] = await Promise.all([
    prisma.unit.aggregate({ where: { propertyId: params.id }, _count: { id: true } }),
    prisma.lease.count({ where: { propertyId: params.id, status: "active" } }),
    prisma.serviceRequest.count({ where: { propertyId: params.id, srStatus: { in: ACTIVE_SR_STATUSES } } }),
    prisma.serviceRequest.count({ where: { propertyId: params.id, srStatus: SrStatus.BLOCKED } }),
    prisma.serviceRequest.count({
      where: { propertyId: params.id, srStatus: { in: [SrStatus.IN_PROGRESS, SrStatus.ASSIGNED, SrStatus.SCHEDULING_PENDING] }, dueAt: { lt: now } },
    }),
    prisma.rentInvoice.findMany({
      where: { Lease: { propertyId: params.id }, paidAt: { gte: startOfMonth }, status: "paid" },
      select: { amountPaidKes: true },
    }),
    prisma.rentInvoice.findMany({
      where: { Lease: { propertyId: params.id }, dueDate: { gte: startOfMonth, lte: now } },
      select: { totalDueKes: true },
    }),
    prisma.rentInvoice.findMany({
      where: { Lease: { propertyId: params.id }, status: { in: ["pending", "overdue"] }, dueDate: { lt: now } },
      select: { id: true, unitId: true, balanceKes: true, dueDate: true, invoiceNumber: true },
      take: 10,
      orderBy: { dueDate: "asc" },
    }),
    prisma.depositEscrow.count({ where: { propertyId: params.id, healthStatus: "fully_covered", status: { in: ["active", "captured"] } } }),
    prisma.depositEscrow.count({ where: { propertyId: params.id, healthStatus: "at_risk", status: { in: ["active", "captured"] } } }),
    prisma.depositEscrow.count({ where: { propertyId: params.id, healthStatus: "shortfall", status: { in: ["active", "captured"] } } }),
    // Same source as the global dashboard's totalEscrowKes, scoped to this property.
    prisma.escrowAccount.findMany({ where: { propertyId: params.id, status: { in: ["HELD", "held"] } }, select: { amountKes: true } }),
    // Tenants currently leasing a unit here, so pendingKyc can be scoped without a
    // direct propertyId column on KycDocument.
    prisma.lease.findMany({ where: { propertyId: params.id, status: "active" }, select: { tenantUserId: true } }),
  ]);

  const units = unitAggregate._count.id;
  const monthlyRentKes = monthlyRentInvoices.reduce((s, i) => s + i.amountPaidKes, 0);
  const totalDueKes = allMonthInvoices.reduce((s, i) => s + i.totalDueKes, 0);
  const arrearsKes = overdueInvoices.reduce((s, inv) => s + inv.balanceKes, 0);
  const totalEscrowKes = escrowAccounts.reduce((s, e) => s + e.amountKes, 0);

  const tenantIds = Array.from(new Set(propertyTenantLeases.map((l) => l.tenantUserId)));
  const pendingKyc = tenantIds.length
    ? await prisma.kycDocument.count({ where: { userId: { in: tenantIds }, status: "pending" } })
    : 0;

  // UtilityDispute has no propertyId column — it hangs off reading -> meter -> unit,
  // so resolve this property's meters first, same join path the utility routes use.
  const propertyUnitIds = (await prisma.unit.findMany({ where: { propertyId: params.id }, select: { id: true } })).map((u) => u.id);
  const propertyMeterIds = propertyUnitIds.length
    ? (await prisma.utilityMeter.findMany({ where: { unitId: { in: propertyUnitIds } }, select: { id: true } })).map((m) => m.id)
    : [];
  const activeDisputes = propertyMeterIds.length
    ? await prisma.utilityDispute.count({
        where: { status: { in: ["OPEN", "LANDLORD_RESPONDED", "ESCALATED"] }, reading: { meterId: { in: propertyMeterIds } } },
      })
    : 0;

  return Response.json({
    data: {
      units,
      activeTenants: activeLeases,
      occupancyRate: units > 0 ? Math.round((activeLeases / units) * 100) : 0,
      collectionRate: totalDueKes > 0 ? Math.round((monthlyRentKes / totalDueKes) * 100) : 0,
      monthlyRentKes,
      totalDueKes,
      arrearsKes,
      totalEscrowKes,
      pendingKyc,
      activeDisputes,
      openServiceRequests,
      blockedServiceRequests,
      slaBreachCount,
      depositFullyCovered,
      depositAtRisk,
      depositShortfall,
      overdueInvoices: overdueInvoices.map((inv) => ({
        id: inv.id,
        unitId: inv.unitId,
        balanceKes: inv.balanceKes,
        dueDate: inv.dueDate,
        invoiceNumber: inv.invoiceNumber,
      })),
    },
  });
});
