import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

function isGlobal(role: string, permissions: string[]) {
  return role === "super_admin" || permissions.includes("*");
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const orgFilter = isGlobal(actor.role, actor.permissions)
    ? {}
    : { organizationId: { in: actor.orgIds } };

  const [
    subscriptions,
    billing,
    referrals,
    plans,
  ] = await Promise.all([
    prisma.userPackageSubscription.findMany({
      where: orgFilter,
      include: { package: true },
    }),
    prisma.subscriptionBillingHistory.findMany({ where: orgFilter }),
    prisma.referral.findMany({
      where: isGlobal(actor.role, actor.permissions)
        ? {}
        : { referralCode: { organizationId: { in: actor.orgIds } } },
      include: { referralCode: true },
    }),
    prisma.package.findMany({ where: { isActive: true } }),
  ]);

  const total = subscriptions.length;
  const trial = subscriptions.filter((s) => s.status === "trial").length;
  const active = subscriptions.filter((s) => s.status === "active").length;
  const cancelled = subscriptions.filter((s) => s.status === "cancelled").length;
  const expired = subscriptions.filter((s) => s.status === "expired").length;
  const paidBilling = billing.filter((b) => b.status === "paid");
  const revenue = paidBilling.reduce((sum, b) => sum + Number(b.amountKes), 0);
  const orgs = new Set(subscriptions.map((s) => s.organizationId ?? s.userId));
  const referralRegistered = referrals.filter((r) => ["registered", "verified", "qualified", "rewarded"].includes(r.status)).length;
  const referralSuccessful = referrals.filter((r) => ["qualified", "rewarded"].includes(r.status)).length;

  const adoptionByPlan = plans.map((plan) => ({
    planId: plan.id,
    planName: plan.name,
    tier: plan.tier,
    count: subscriptions.filter((s) => s.packageId === plan.id).length,
  }));

  const acquisitionSources = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.acquisitionSource] = (acc[s.acquisitionSource] ?? 0) + 1;
    return acc;
  }, {});

  return Response.json({
    data: {
      subscriptionPlanAdoption: adoptionByPlan,
      trialToPaidConversionRate: trial + active > 0 ? Math.round((active / (trial + active)) * 100) : 0,
      subscriptionRenewalRate: total > 0 ? Math.round(((active + trial) / total) * 100) : 0,
      referralConversionRate: referrals.length > 0 ? Math.round((referralRegistered / referrals.length) * 100) : 0,
      successfulReferrals: referralSuccessful,
      acquisitionSources,
      averageRevenuePerOrganization: orgs.size > 0 ? Math.round(revenue / orgs.size) : 0,
      pilotFeedbackCaptured: 0,
      totals: {
        subscriptions: total,
        trial,
        active,
        cancelled,
        expired,
        referrals: referrals.length,
        revenueKes: revenue,
      },
    },
  });
});
