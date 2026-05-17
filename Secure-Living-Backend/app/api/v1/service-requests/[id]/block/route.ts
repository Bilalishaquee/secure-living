import { z } from "zod";
import { SrStatus, BlockedReasonType } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const blockSchema = z.object({
  blockedReasonType: z.nativeEnum(BlockedReasonType),
  blockedReason: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.blockedReasonType === BlockedReasonType.OTHER && !data.blockedReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "blockedReason is required when blockedReasonType is OTHER",
      path: ["blockedReason"],
    });
  }
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:execute");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  if (!canSrTransition(existing.srStatus, SrStatus.BLOCKED)) {
    return jsonError(409, `Cannot transition from ${existing.srStatus} to BLOCKED`);
  }

  const parsed = await parseBody(req, blockSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.update({
      where: { id: params.id },
      data: {
        srStatus: SrStatus.BLOCKED,
        status: "BLOCKED",
        blockedReasonType: parsed.data.blockedReasonType,
        blockedReason: parsed.data.blockedReason ?? null,
      },
    });
    await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, SrStatus.BLOCKED, parsed.data.blockedReason);
    await writeOutboxEvent(tx, SR_EVENT_MAP[SrStatus.BLOCKED], { serviceRequestId: params.id, actorId: actor.userId, blockedReasonType: parsed.data.blockedReasonType }, params.id);
    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.blocked",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: { srStatus: existing.srStatus },
    afterJson: { srStatus: updated.srStatus, blockedReasonType: parsed.data.blockedReasonType },
  });

  return Response.json({ data: updated });
});
