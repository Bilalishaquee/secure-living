import { z } from "zod";
import { SrStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const assignSchema = z.object({
  assignedTo: z.string().min(1, "assignedTo is required"),
  role: z.string().optional().default("primary"),
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

  if (!canSrTransition(existing.srStatus, SrStatus.ASSIGNED)) {
    return jsonError(409, `Cannot transition from ${existing.srStatus} to ASSIGNED`);
  }

  const parsed = await parseBody(req, assignSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.update({
      where: { id: params.id },
      data: {
        srStatus: SrStatus.ASSIGNED,
        status: "ASSIGNED",
        assignedToUserId: parsed.data.assignedTo,
      },
    });

    await tx.serviceRequestAssignment.create({
      data: {
        id: randomUUID(),
        serviceRequestId: params.id,
        assignedTo: parsed.data.assignedTo,
        assignedBy: actor.userId,
        role: parsed.data.role,
      },
    });

    await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, SrStatus.ASSIGNED);
    await writeOutboxEvent(tx, SR_EVENT_MAP[SrStatus.ASSIGNED], { serviceRequestId: params.id, actorId: actor.userId, assignedTo: parsed.data.assignedTo }, params.id);
    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.assigned",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: { srStatus: existing.srStatus, assignedToUserId: existing.assignedToUserId },
    afterJson: { srStatus: updated.srStatus, assignedToUserId: updated.assignedToUserId },
  });

  return Response.json({ data: updated });
});
