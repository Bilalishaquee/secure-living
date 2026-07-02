import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

// Super Admin dashboard — the doc's 9 named sections beyond "Platform Overview"
// (which the existing /api/v1/dashboard/stats route already covers). Restricted to
// platform:stats:view (super admin via "*").
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "platform:stats:view");
  if (denied) return denied;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    monthlyTransactions,
    monthlySubscriptionRevenue,
    activeSubscriptions,
    pendingSubscriptionInvoices,
    slaBreaches90d,
    disputesOpen,
    providersByStatus,
    providerPerformance,
    newOrgs30d,
    newUsers30d,
    referralActivity90d,
    recentAlerts,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: "completed" },
      _sum: { amountKes: true, feeKes: true },
      _count: { id: true },
    }),
    prisma.subscriptionBillingHistory.aggregate({
      where: { paidAt: { gte: startOfMonth }, status: "paid" },
      _sum: { amountKes: true },
    }),
    prisma.userSubscription.count({ where: { status: "active" } }),
    prisma.subscriptionBillingHistory.count({ where: { status: "pending" } }),
    prisma.serviceRequest.count({
      where: { dueAt: { lt: now, gte: ninetyDaysAgo }, srStatus: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.utilityDispute.count({ where: { status: { in: ["OPEN", "LANDLORD_RESPONDED", "ESCALATED"] } } }),
    prisma.serviceProvider.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.serviceProviderPerformance.aggregate({
      _avg: { disputeRate: true, cancellationRate: true },
      _sum: { totalJobsCompleted: true },
    }),
    prisma.organization.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.appUser.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.referralActivity.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 15,
      select: { id: true, action: true, resourceType: true, role: true, timestamp: true },
    }),
  ]);

  return Response.json({
    data: {
      revenueFinance: {
        monthlyTransactionVolumeKes: monthlyTransactions._sum.amountKes ?? 0,
        monthlyTransactionFeesKes: monthlyTransactions._sum.feeKes ?? 0,
        monthlyTransactionCount: monthlyTransactions._count.id,
        monthlySubscriptionRevenueKes: Number(monthlySubscriptionRevenue._sum.amountKes ?? 0),
        activeSubscriptions,
        pendingSubscriptionInvoices,
      },
      platformHealth: {
        slaBreaches90d,
        openDisputes: disputesOpen,
      },
      marketplacePerformance: {
        providersByStatus: providersByStatus.map((p) => ({ status: p.status, count: p._count.id })),
        avgDisputeRate: providerPerformance._avg.disputeRate ?? 0,
        avgCancellationRate: providerPerformance._avg.cancellationRate ?? 0,
        totalJobsCompleted: providerPerformance._sum.totalJobsCompleted ?? 0,
      },
      growthAcquisition: {
        newOrganizations30d: newOrgs30d,
        newUsers30d,
        referralActivity90d,
      },
      alertsLiveActivity: recentAlerts,
    },
  });
});
