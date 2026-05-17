import { z } from "zod";
import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const approveSchema = z.object({
  initiateQuote: z.boolean().optional().default(false),
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

  const parsed = await parseBody(req, approveSchema);
  if (!parsed.ok) return parsed.response;

  const targetStatus = parsed.data.initiateQuote ? SrStatus.QUOTING : SrStatus.APPROVED;

  if (!canSrTransition(existing.srStatus, targetStatus)) {
    return jsonError(409, `Cannot transition from ${existing.srStatus} to ${targetStatus}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.update({
      where: { id: params.id },
      data: {
        srStatus: targetStatus,
        status: targetStatus,
        approvedAt: new Date(),
      },
    });
    await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, targetStatus);
    await writeOutboxEvent(tx, SR_EVENT_MAP[targetStatus], { serviceRequestId: params.id, actorId: actor.userId }, params.id);
    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.approved",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: { srStatus: existing.srStatus },
    afterJson: { srStatus: updated.srStatus },
  });

  return Response.json({ data: updated });
});
