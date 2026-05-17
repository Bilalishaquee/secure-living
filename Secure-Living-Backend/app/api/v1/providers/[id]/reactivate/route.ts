import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const reactivateSchema = z.object({
  justification: z.string().min(1, "Justification is required"),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const provider = await prisma.serviceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return jsonError(404, "Provider not found");
  if (!["SUSPENDED", "INACTIVE"].includes(provider.status)) {
    return jsonError(409, "Provider must be SUSPENDED or INACTIVE to reactivate");
  }

  const parsed = await parseBody(req, reactivateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.serviceProvider.update({
    where: { id: params.id },
    data: {
      status: "ACTIVE",
      suspensionReason: null,
    },
  });

  await prisma.serviceProviderAuditLog.create({
    data: {
      id: randomUUID(),
      providerId: params.id,
      action: "reactivated",
      fromStatus: provider.status,
      toStatus: "ACTIVE",
      reason: parsed.data.justification,
      reviewedBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "provider.reactivated",
    resourceType: "service_provider",
    resourceId: params.id,
    orgId: provider.organizationId,
    beforeJson: provider,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
