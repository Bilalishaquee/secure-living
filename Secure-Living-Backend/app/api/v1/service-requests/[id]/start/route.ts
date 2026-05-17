import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:execute");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  if (!canSrTransition(existing.srStatus, SrStatus.IN_PROGRESS)) {
    return jsonError(409, `Cannot transition from ${existing.srStatus} to IN_PROGRESS`);
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.update({
      where: { id: params.id },
      data: {
        srStatus: SrStatus.IN_PROGRESS,
        status: "IN_PROGRESS",
        startedAt: existing.startedAt ?? now,
      },
    });
    await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, SrStatus.IN_PROGRESS);
    await writeOutboxEvent(tx, SR_EVENT_MAP[SrStatus.IN_PROGRESS], { serviceRequestId: params.id, actorId: actor.userId }, params.id);
    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.started",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: { srStatus: existing.srStatus },
    afterJson: { srStatus: updated.srStatus, startedAt: updated.startedAt },
  });

  return Response.json({ data: updated });
});
