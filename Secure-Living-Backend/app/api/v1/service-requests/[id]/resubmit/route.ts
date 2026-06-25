import { z } from "zod";
import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const resubmitSchema = z.object({
  rectificationNotes: z.string().min(3, "Rectification notes are required"),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:create");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  if (existing.srStatus !== SrStatus.REJECTED) {
    return jsonError(409, "Only rejected service requests can be resubmitted");
  }

  const parsed = await parseBody(req, resubmitSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.$transaction(async (tx) => {
    const currentNotes = existing.internalNotes ? `${existing.internalNotes}\n\n` : "";
    const sr = await tx.serviceRequest.update({
      where: { id: params.id },
      data: {
        srStatus: SrStatus.SUBMITTED,
        status: "SUBMITTED",
        rejectionReason: null,
        internalNotes: `${currentNotes}Rectification before resubmission: ${parsed.data.rectificationNotes}`,
      },
    });
    await writeSrTransition(tx, params.id, actor.userId, SrStatus.REJECTED, SrStatus.SUBMITTED, parsed.data.rectificationNotes);
    await writeOutboxEvent(tx, "request.resubmitted", { serviceRequestId: params.id, actorId: actor.userId }, params.id);
    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.resubmitted",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: { srStatus: existing.srStatus, rejectionReason: existing.rejectionReason },
    afterJson: { srStatus: updated.srStatus, rectificationNotes: parsed.data.rectificationNotes },
  });

  return Response.json({ data: updated });
});
