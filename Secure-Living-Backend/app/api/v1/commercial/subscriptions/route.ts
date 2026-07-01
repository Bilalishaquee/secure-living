import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { canAccessOrg } from "@/lib/server/authz";
import { jsonError, parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const createSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().optional(),
  packageId: z.string().min(1),
  status: z.enum(["trial", "active", "suspended", "cancelled", "expired"]).default("trial"),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  startedAt: z.string().datetime().optional(),
  nextBillingAt: z.string().datetime().optional(),
  trialEndsAt: z.string().datetime().optional(),
  acquisitionSource: z.enum(["direct", "referral", "partner"]).default("direct"),
  referralId: z.string().optional(),
  createInvoice: z.boolean().default(true),
  paymentMethod: z.string().optional(),
});

function canManageCommercial(role: string, permissions: string[]) {
  return role === "super_admin" || role === "admin" || permissions.includes("*") || permissions.includes("org:manage");
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function invoiceNumber() {
  return `SUB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const url = new URL(req.url);
  const current = url.searchParams.get("current") === "true";

  if (current) {
    const row = await prisma.userPackageSubscription.findFirst({
      where: {
        OR: [
          { userId: actor.userId },
          ...actor.orgIds.map((organizationId) => ({ organizationId })),
        ],
        status: { in: ["trial", "active", "suspended"] },
      },
      include: { package: true, billingHistory: { orderBy: { issuedAt: "desc" }, take: 5 }, referral: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ data: row });
  }

  const manageable = canManageCommercial(actor.role, actor.permissions);
  const orgId = url.searchParams.get("organizationId");
  const where = manageable
    ? orgId
      ? { organizationId: orgId }
      : actor.role === "super_admin" || actor.permissions.includes("*")
        ? {}
        : { organizationId: { in: actor.orgIds } }
    : { OR: [{ userId: actor.userId }, ...actor.orgIds.map((organizationId) => ({ organizationId }))] };

  const rows = await prisma.userPackageSubscription.findMany({
    where,
    include: { package: true, billingHistory: { orderBy: { issuedAt: "desc" }, take: 3 }, referral: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const isSelf = body.userId === actor.userId || (!!body.organizationId && actor.orgIds.includes(body.organizationId));
  if (!canManageCommercial(actor.role, actor.permissions) && !isSelf) return jsonError(403, "Forbidden");
  if (body.organizationId && !canAccessOrg(actor, body.organizationId)) return jsonError(403, "Out of scope");

  const pkg = await prisma.package.findUnique({ where: { id: body.packageId } });
  if (!pkg) return jsonError(404, "Plan not found");

  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
  const nextBillingAt = body.nextBillingAt ? new Date(body.nextBillingAt) : addMonths(startedAt, body.billingCycle === "annual" ? 12 : 1);
  const trialEndsAt = body.trialEndsAt ? new Date(body.trialEndsAt) : body.status === "trial" ? addMonths(startedAt, 1) : null;

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.userPackageSubscription.create({
      data: {
        userId: body.userId,
        organizationId: body.organizationId,
        packageId: body.packageId,
        status: body.status,
        billingCycle: body.billingCycle,
        startedAt,
        nextBillingAt,
        trialEndsAt,
        acquisitionSource: body.acquisitionSource,
        referralId: body.referralId,
        renewalReminderAt: nextBillingAt,
      },
    });

    if (body.createInvoice) {
      const amount = body.billingCycle === "annual"
        ? Number(pkg.monthlyPriceKes) * 12 * (pkg.annualDiscountEligible ? 0.9 : 1)
        : Number(pkg.monthlyPriceKes);
      await tx.subscriptionBillingHistory.create({
        data: {
          subscriptionId: created.id,
          organizationId: body.organizationId,
          userId: body.userId,
          packageId: body.packageId,
          billingCycle: body.billingCycle,
          amountKes: amount,
          invoiceNumber: invoiceNumber(),
          status: body.status === "trial" ? "waived" : "pending",
          paymentMethod: body.paymentMethod,
          periodStart: startedAt,
          periodEnd: nextBillingAt,
          notes: body.status === "trial" ? "Pilot trial period invoice waived" : "Pilot subscription invoice",
        },
      });
    }

    if (body.referralId) {
      await tx.referral.update({
        where: { id: body.referralId },
        data: { status: "registered", referredUserId: body.userId },
      });
      await tx.referralActivity.create({
        data: { referralId: body.referralId, actorUserId: actor.userId, eventType: "registered", note: "Subscription created from referral" },
      });
    }

    return created;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "commercial.subscription.created",
    resourceType: "user_package_subscription",
    resourceId: row.id,
    orgId: row.organizationId,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
});
