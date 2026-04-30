import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { createSubscriptionPlanSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;
  const rows = await prisma.subscriptionPlan.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, createSubscriptionPlanSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const row = await prisma.subscriptionPlan.create({
    data: {
      id: randomUUID(),
      code: b.code,
      name: b.name,
      priceKesMonthly: b.priceKesMonthly,
      priceKesAnnual: b.priceKesAnnual,
      featureJson: JSON.stringify(b.featureJson),
      isActive: b.isActive ?? true,
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "subscription_plan.created",
    resourceType: "subscription_plan",
    resourceId: row.id,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
})
