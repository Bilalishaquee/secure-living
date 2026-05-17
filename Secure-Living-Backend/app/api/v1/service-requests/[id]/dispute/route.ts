import { z } from "zod";
import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, canManageSr, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const disputeSchema = z.object({
  reason: z.string().min(1, "Dispute reason is required"),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:dispute");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  // Only the original requester (tenantUserId) or a manager can dispute
  const isTenant = existing.tenantUserId === actor.userId;
  const isManager = canManageSr(actor);
  if (!isTenant && !isManager) {
    return jsonError(403, "Only the original requester or a manager can dispute a completed request");
  }

  if (!canSrTransition(existing.srStatus, SrStatus.DISPUTED)) {
    return jsonError(409, `Cannot transition from ${existing.srStatus} to DISPUTED`);
  }

  const parsed = await parseBody(req, disputeSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.update({
      where: { id: params.id },
      data: {
        srStatus: SrStatus.DISPUTED,
        status: "DISPUTED",
        disputeReason: parsed.data.reason,
      },
    });
    await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, SrStatus.DISPUTED, parsed.data.reason);
    await writeOutboxEvent(tx, SR_EVENT_MAP[SrStatus.DISPUTED], { serviceRequestId: params.id, actorId: actor.userId, reason: parsed.data.reason }, params.id);
    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.disputed",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: { srStatus: existing.srStatus },
    afterJson: { srStatus: updated.srStatus, disputeReason: parsed.data.reason },
  });

  return Response.json({ data: updated });
});
