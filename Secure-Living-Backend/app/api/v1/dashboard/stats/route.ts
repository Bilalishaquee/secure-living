import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

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

  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  const orgFilter = isGlobal ? {} : { organizationId: { in: actor.orgIds } };
  const invoiceOrgFilter = isGlobal ? {} : { Lease: { organizationId: { in: actor.orgIds } } };
  // Audit logs use orgId (nullable) — match on org, fallback to empty set for non-global
  const auditOrgWhere = isGlobal ? {} : { orgId: { in: actor.orgIds } };
  // KYC docs use optional organizationId — only count those belonging to actor's org
  const kycWhere = isGlobal
    ? { status: "pending" }
    : { status: "pending", organizationId: { in: actor.orgIds.length > 0 ? actor.orgIds : ["__none__"] } };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    propertyAggregate,
    activeLeases,
    pendingKyc,
    openServiceRequests,
    blockedServiceRequests,
    slaBreachCount,
    activeDisputes,
    escrowAccounts,
    monthlyRentInvoices,
    recentAuditLogs,
    allMonthInvoices,
    escrowTrendRaw,
    myAssignedJobs,
    totalOrganizations,
    activeLandlords,
    activePropertyManagers,
    activeProviders,
    serviceRequestsInProgress,
    serviceRequestsAwaitingConfirmation,
    serviceRequestsOverdue,
  ] = await Promise.all([
    // Single aggregate gives both property count and the sum of their declared unit capacity
    prisma.property.aggregate({
      where: orgFilter,
      _count: { id: true },
      _sum: { totalUnits: true },
    }),
    prisma.lease.count({ where: { ...orgFilter, status: "active" } }),
    prisma.kycDocument.count({ where: kycWhere }),
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
    prisma.utilityDispute.count({
      where: { status: { in: ["OPEN", "LANDLORD_RESPONDED", "ESCALATED"] } },
    }),
    prisma.escrowAccount.findMany({
      where: { status: { in: ["HELD", "held"] } },
      select: { amountKes: true },
    }),
    prisma.rentInvoice.findMany({
      where: { ...invoiceOrgFilter, paidAt: { gte: startOfMonth }, status: "paid" },
      select: { amountPaidKes: true },
    }),
    prisma.auditLog.findMany({
      where: auditOrgWhere,
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
    // All invoices due this month (paid + unpaid) for collection rate
    prisma.rentInvoice.findMany({
      where: { ...invoiceOrgFilter, dueDate: { gte: startOfMonth, lte: now } },
      select: { totalDueKes: true, amountPaidKes: true, status: true },
    }),
    // Last 8 weeks of escrow accounts for the trend chart
    prisma.escrowAccount.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000) } },
      select: { amountKes: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Service requests assigned to this specific user (for staff "My Jobs" KPI)
    prisma.serviceRequestAssignment.count({
      where: {
        assignedTo: actor.userId,
        serviceRequest: {
          srStatus: { in: ACTIVE_SR_STATUSES },
        },
      },
    }),
    prisma.organization.count({ where: isGlobal ? {} : { id: { in: actor.orgIds } } }),
    prisma.userRoleAssignment.count({
      where: {
        status: "active",
        ...(isGlobal ? {} : { organizationId: { in: actor.orgIds } }),
        role: { slug: { in: ["landlord", "owner", "property_owner"] } },
      },
    }),
    prisma.userRoleAssignment.count({
      where: {
        status: "active",
        ...(isGlobal ? {} : { organizationId: { in: actor.orgIds } }),
        role: { slug: { in: ["admin", "agency", "manager", "property_manager"] } },
      },
    }),
    prisma.serviceProvider.count({
      where: {
        ...(isGlobal ? {} : { organizationId: { in: actor.orgIds } }),
        status: "ACTIVE",
      },
    }),
    prisma.serviceRequest.count({ where: { ...orgFilter, srStatus: SrStatus.IN_PROGRESS } }),
    prisma.serviceRequest.count({ where: { ...orgFilter, srStatus: { in: [SrStatus.SUBMITTED, SrStatus.APPROVED, SrStatus.QUOTING] } } }),
    prisma.serviceRequest.count({
      where: {
        ...orgFilter,
        srStatus: { in: ACTIVE_SR_STATUSES },
        dueAt: { lt: now },
      },
    }),
  ]);

  // Derive property count and unit capacity from the aggregate
  const properties = propertyAggregate._count.id;
  const units = propertyAggregate._sum.totalUnits ?? 0;

  const totalEscrowKes = escrowAccounts.reduce((s, e) => s + e.amountKes, 0);
  const monthlyRentKes = monthlyRentInvoices.reduce((s, i) => s + i.amountPaidKes, 0);

  // Occupancy rate = active leases / total units (capped 0–100)
  const occupancyRate = units > 0 ? Math.round((activeLeases / units) * 100) : 0;

  // Collection rate = paid this month / total due this month
  const totalDueKes = allMonthInvoices.reduce((s, i) => s + i.totalDueKes, 0);
  const collectionRate = totalDueKes > 0 ? Math.round((monthlyRentKes / totalDueKes) * 100) : 0;

  // Overdue invoices for alerts + arrears total
  const overdueInvoices = await prisma.rentInvoice.findMany({
    where: {
      ...invoiceOrgFilter,
      status: { in: ["pending", "overdue"] },
      dueDate: { lt: now },
    },
    select: {
      id: true,
      unitId: true,
      balanceKes: true,
      dueDate: true,
      invoiceNumber: true,
    },
    take: 10,
    orderBy: { dueDate: "asc" },
  });

  const arrearsKes = overdueInvoices.reduce((s, inv) => s + inv.balanceKes, 0);

  // Weekly escrow trend — last 7 weeks bucketed
  const weeklyEscrowTrend = buildWeeklyTrend(escrowTrendRaw, now);

  const alerts = [
    ...overdueInvoices.map((inv) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      const unitLabel = inv.unitId.slice(0, 8);
      const invoiceLabel = inv.invoiceNumber ?? inv.id.slice(0, 8);
      return {
        type: "overdue_rent" as const,
        severity: (daysOverdue > 30 ? "high" : "medium") as "high" | "medium",
        message: `${invoiceLabel} — Unit ${unitLabel} overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} (KES ${inv.balanceKes.toLocaleString()})`,
        resourceId: inv.id,
        resourceType: "rent_invoice",
        href: "/rent-collection/receipts",
      };
    }),
    ...(isGlobal && activeDisputes > 0
      ? [{
          type: "dispute" as const, severity: "high" as const,
          message: `${activeDisputes} utility dispute${activeDisputes !== 1 ? "s" : ""} open — awaiting resolution`,
          resourceId: "", resourceType: "utility_dispute", href: "/admin/disputes",
        }]
      : []),
    ...(pendingKyc > 0
      ? [{
          type: "kyc" as const, severity: (pendingKyc > 5 ? "high" : "medium") as "high" | "medium",
          message: `${pendingKyc} KYC document${pendingKyc !== 1 ? "s" : ""} pending review`,
          resourceId: "", resourceType: "kyc_document", href: "/kyc",
        }]
      : []),
    ...(blockedServiceRequests > 0
      ? [{
          type: "blocked_sr" as const, severity: "medium" as const,
          message: `${blockedServiceRequests} service request${blockedServiceRequests !== 1 ? "s" : ""} blocked — follow up needed`,
          resourceId: "", resourceType: "service_request", href: "/service-requests/manager-queue",
        }]
      : []),
    ...(slaBreachCount > 0
      ? [{
          type: "sla_breach" as const, severity: "high" as const,
          message: `${slaBreachCount} service request${slaBreachCount !== 1 ? "s" : ""} past their SLA deadline`,
          resourceId: "", resourceType: "service_request", href: "/service-requests/manager-queue",
        }]
      : []),
  ];

  return Response.json({
    data: {
      totalEscrowKes,
      monthlyRentKes,
      totalDueKes,
      properties,
      units,
      activeTenants: activeLeases,
      occupancyRate,
      collectionRate,
      arrearsKes,
      pendingKyc,
      activeDisputes,
      openServiceRequests,
      blockedServiceRequests,
      slaBreachCount,
      myAssignedJobs,
      totalOrganizations,
      activeLandlords,
      activePropertyManagers,
      activeProviders,
      serviceRequestsInProgress,
      serviceRequestsAwaitingConfirmation,
      serviceRequestsOverdue,
      weeklyEscrowTrend,
      recentActivity: recentAuditLogs,
      alerts,
    },
  });
});

function buildWeeklyTrend(
  records: { amountKes: number; createdAt: Date }[],
  now: Date
): { w: string; v: number }[] {
  // 7 buckets — W-6 through W0 (current week)
  const buckets: number[] = new Array(7).fill(0);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startOfCurrentWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  for (const r of records) {
    const diff = startOfCurrentWeek.getTime() - new Date(r.createdAt).getTime();
    const weekIdx = 6 - Math.floor(diff / msPerWeek);
    if (weekIdx >= 0 && weekIdx < 7) {
      buckets[weekIdx] += r.amountKes;
    }
  }

  // Build running cumulative so it looks like a balance trend
  let cumulative = 0;
  return buckets.map((v, i) => {
    cumulative += v;
    return { w: `W${i + 1}`, v: cumulative };
  });
}
