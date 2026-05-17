import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const suspendSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const provider = await prisma.serviceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return jsonError(404, "Provider not found");
  if (!["ACTIVE", "INACTIVE"].includes(provider.status)) {
    return jsonError(409, "Provider must be ACTIVE or INACTIVE to suspend");
  }

  const parsed = await parseBody(req, suspendSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.serviceProvider.update({
    where: { id: params.id },
    data: {
      status: "SUSPENDED",
      suspensionReason: parsed.data.reason,
      suspendedAt: new Date(),
    },
  });

  await prisma.serviceProviderAuditLog.create({
    data: {
      id: randomUUID(),
      providerId: params.id,
      action: "suspended",
      fromStatus: provider.status,
      toStatus: "SUSPENDED",
      reason: parsed.data.reason,
      reviewedBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "provider.suspended",
    resourceType: "service_provider",
    resourceId: params.id,
    orgId: provider.organizationId,
    beforeJson: provider,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
