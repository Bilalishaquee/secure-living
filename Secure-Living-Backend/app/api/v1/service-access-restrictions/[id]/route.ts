import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "platform:service-restrictions:manage");
  if (denied) return denied;

  const existing = await prisma.serviceAccessRestriction.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Restriction not found");

  await prisma.serviceAccessRestriction.delete({ where: { id: params.id } });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_access_restriction.deleted",
    resourceType: "ServiceAccessRestriction",
    resourceId: params.id,
    beforeJson: existing,
  });

  return Response.json({ data: { deleted: true } });
});
