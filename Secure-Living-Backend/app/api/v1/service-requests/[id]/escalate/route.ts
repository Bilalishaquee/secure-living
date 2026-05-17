import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const escalateSchema = z.object({
  escalatedTo: z.string().min(1, "escalatedTo is required"),
  reason: z.string().min(1, "reason is required"),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, escalateSchema);
  if (!parsed.ok) return parsed.response;

  const escalation = await prisma.$transaction(async (tx) => {
    const esc = await tx.serviceRequestEscalation.create({
      data: {
        id: randomUUID(),
        serviceRequestId: params.id,
        escalatedBy: actor.userId,
        escalatedTo: parsed.data.escalatedTo,
        reason: parsed.data.reason,
      },
    });

    await writeOutboxEvent(tx, "request.escalated", { serviceRequestId: params.id, actorId: actor.userId, escalatedTo: parsed.data.escalatedTo, reason: parsed.data.reason }, params.id);

    return esc;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.escalated",
    resourceType: "service_request",
    resourceId: params.id,
    orgId: existing.organizationId,
    branchId: existing.branchId,
    afterJson: escalation,
  });

  return Response.json({ data: escalation }, { status: 201 });
});
