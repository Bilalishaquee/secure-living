import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { canAccessOrg } from "@/lib/server/authz";
import { jsonError, parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const updateSchema = z.object({
  packageId: z.string().optional(),
  status: z.enum(["trial", "active", "suspended", "cancelled", "expired"]).optional(),
  billingCycle: z.enum(["monthly", "annual"]).optional(),
  nextBillingAt: z.string().datetime().nullable().optional(),
  trialEndsAt: z.string().datetime().nullable().optional(),
  paymentMethod: z.string().optional(),
  note: z.string().optional(),
});

function canManageCommercial(role: string, permissions: string[]) {
  return role === "super_admin" || role === "admin" || permissions.includes("*") || permissions.includes("org:manage");
}

export const PUT = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const existing = await prisma.userPackageSubscription.findUnique({ where: { id: params.id }, include: { package: true } });
  if (!existing) return jsonError(404, "Subscription not found");
  const owns = existing.userId === actor.userId || (!!existing.organizationId && actor.orgIds.includes(existing.organizationId));
  if (!canManageCommercial(actor.role, actor.permissions) && !owns) return jsonError(403, "Forbidden");
  if (existing.organizationId && !canAccessOrg(actor, existing.organizationId)) return jsonError(403, "Out of scope");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const now = new Date();

  const row = await prisma.userPackageSubscription.update({
    where: { id: params.id },
    data: {
      packageId: body.packageId,
      status: body.status,
      billingCycle: body.billingCycle,
      nextBillingAt: body.nextBillingAt === undefined ? undefined : body.nextBillingAt ? new Date(body.nextBillingAt) : null,
      trialEndsAt: body.trialEndsAt === undefined ? undefined : body.trialEndsAt ? new Date(body.trialEndsAt) : null,
      suspendedAt: body.status === "suspended" ? now : undefined,
      canceledAt: body.status === "cancelled" ? now : undefined,
      expiredAt: body.status === "expired" ? now : undefined,
    },
    include: { package: true, billingHistory: { orderBy: { issuedAt: "desc" }, take: 5 } },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "commercial.subscription.updated",
    resourceType: "user_package_subscription",
    resourceId: row.id,
    orgId: row.organizationId,
    beforeJson: existing,
    afterJson: { ...row, note: body.note },
  });
  return Response.json({ data: row });
});
