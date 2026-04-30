import { randomUUID } from "crypto";
import { canAccessOrg } from "@/lib/server/authz";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { createUserSubscriptionSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;
  const rows = await prisma.userSubscription.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, createUserSubscriptionSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  if (b.organizationId) {
    if (!canAccessOrg(actor, b.organizationId)) return jsonError(403, "Out of scope");
  }

  const row = await prisma.userSubscription.create({
    data: {
      id: randomUUID(),
      userId: b.userId,
      organizationId: b.organizationId,
      planCode: b.planCode,
      status: b.status,
      billingCycle: b.billingCycle,
      startedAt: new Date(b.startedAt),
      nextBillingAt: b.nextBillingAt ? new Date(b.nextBillingAt) : null,
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "user_subscription.created",
    resourceType: "user_subscription",
    resourceId: row.id,
    orgId: row.organizationId,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
})
