import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const provider = await prisma.serviceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return jsonError(404, "Provider not found");
  if (provider.status !== "PENDING_APPROVAL") {
    return jsonError(409, "Provider must be in PENDING_APPROVAL status to approve");
  }

  const updated = await prisma.serviceProvider.update({
    where: { id: params.id },
    data: {
      status: "ACTIVE",
      approvedAt: new Date(),
      approvedBy: actor.userId,
    },
  });

  await prisma.serviceProviderAuditLog.create({
    data: {
      id: randomUUID(),
      providerId: params.id,
      action: "approved",
      fromStatus: "PENDING_APPROVAL",
      toStatus: "ACTIVE",
      reviewedBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "provider.approved",
    resourceType: "service_provider",
    resourceId: params.id,
    orgId: provider.organizationId,
    beforeJson: provider,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
