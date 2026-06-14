import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

// Phase 3: Active service request statuses using the SrStatus enum
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

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const isGlobal = actor.permissions.includes("*");
  const orgFilter = isGlobal ? {} : { organizationId: { in: actor.orgIds } };
  const invoiceOrgFilter = isGlobal ? {} : { Lease: { organizationId: { in: actor.orgIds } } };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    properties,
    units,
    activeLeases,
    pendingKyc,
    openServiceRequests,
    blockedServiceRequests,
    slaBreachCount,
    activeDisputes,
    escrowAccounts,
    monthlyRentInvoices,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.property.count({ where: orgFilter }),
    prisma.unit.count({ where: orgFilter }),
    prisma.lease.count({ where: { ...orgFilter, status: "active" } }),
    prisma.kycDocument.count({ where: { status: "pending" } }),
    prisma.serviceRequest.count({
      where: { ...orgFilter, srStatus: { in: ACTIVE_SR_STATUSES } },
    }),
    prisma.serviceRequest.count({
      where: { ...orgFilter, srStatus: SrStatus.BLOCKED },
    }),
    prisma.serviceRequest.count({
      where: {
        ...orgFilter,
        srStatus: { in: [SrStatus.IN_PROGRESS, SrStatus.ASSIGNED, SrStatus.SCHEDULING_PENDING] },
        dueAt: { lt: now },
      },
    }),
    prisma.escrowAccount.count({ where: { status: "disputed" } }),
    prisma.escrowAccount.findMany({ where: { status: "held" }, select: { amountKes: true } }),
    prisma.rentInvoice.findMany({
      where: { ...invoiceOrgFilter, paidAt: { gte: startOfMonth }, status: "paid" },
      select: { amountPaidKes: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        userId: true,
        role: true,
        timestamp: true,
        orgId: true,
      },
    }),
  ]);

  const totalEscrowKes = escrowAccounts.reduce((s, e) => s + e.amountKes, 0);
  const monthlyRentKes = monthlyRentInvoices.reduce((s, i) => s + i.amountPaidKes, 0);

  const overdueInvoices = await prisma.rentInvoice.findMany({
    where: {
      ...invoiceOrgFilter,
      status: { in: ["pending", "overdue"] },
      dueDate: { lt: now },
    },
    select: { id: true, unitId: true, balanceKes: true, dueDate: true },
    take: 10,
    orderBy: { dueDate: "asc" },
  });

  const alerts = [
    ...overdueInvoices.map((inv) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      return {
        type: "overdue_rent" as const,
        severity: daysOverdue > 30 ? "high" : "medium",
        message: `Rent overdue by ${daysOverdue} days — Unit ${inv.unitId.slice(0, 8)}`,
        resourceId: inv.id,
        resourceType: "rent_invoice",
      };
    }),
    ...(activeDisputes > 0
      ? [{ type: "dispute" as const, severity: "high" as const, message: `${activeDisputes} active escrow dispute(s) require attention`, resourceId: "", resourceType: "escrow" }]
      : []),
    ...(pendingKyc > 5
      ? [{ type: "kyc" as const, severity: "medium" as const, message: `${pendingKyc} KYC documents pending review`, resourceId: "", resourceType: "kyc_document" }]
      : []),
    ...(blockedServiceRequests > 0
      ? [{ type: "blocked_sr" as const, severity: "medium" as const, message: `${blockedServiceRequests} service request(s) blocked — follow up needed`, resourceId: "", resourceType: "service_request" }]
      : []),
    ...(slaBreachCount > 0
      ? [{ type: "sla_breach" as const, severity: "high" as const, message: `${slaBreachCount} service request(s) past their SLA deadline`, resourceId: "", resourceType: "service_request" }]
      : []),
  ];

  return Response.json({
    data: {
      totalEscrowKes,
      monthlyRentKes,
      properties,
      units,
      activeTenants: activeLeases,
      pendingKyc,
      activeDisputes,
      openServiceRequests,
      blockedServiceRequests,
      slaBreachCount,
      recentActivity: recentAuditLogs,
      alerts,
    },
  });
})
