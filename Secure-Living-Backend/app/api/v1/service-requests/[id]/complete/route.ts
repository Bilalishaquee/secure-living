import { z } from "zod";
import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

const completeSchema = z.object({
  resolutionNotes: z.string().min(1, "resolutionNotes is required"),
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

  if (!canSrTransition(existing.srStatus, SrStatus.COMPLETED)) {
    return jsonError(409, `Cannot transition from ${existing.srStatus} to COMPLETED`);
  }

  const parsed = await parseBody(req, completeSchema);
  if (!parsed.ok) return parsed.response;

  // Evidence enforcement: check required evidence types are uploaded
  if (existing.serviceType) {
    const typeConfig = await prisma.serviceTypeConfig.findUnique({
      where: { serviceType: existing.serviceType },
    });
    if (typeConfig && Array.isArray(typeConfig.evidenceRequirements) && typeConfig.evidenceRequirements.length > 0) {
      // Phase 3: Check that each required evidence type is actually present
      const requiredTypes = typeConfig.evidenceRequirements as string[];
      const uploadedEvidence = await prisma.serviceRequestEvidence.findMany({
        where: { serviceRequestId: params.id },
        select: { mediaType: true },
      });
      const uploadedTypes = new Set(uploadedEvidence.map((e) => e.mediaType));
      const missingTypes = requiredTypes.filter((reqType) => !uploadedTypes.has(reqType));

      if (missingTypes.length > 0) {
        return jsonError(422, `Missing required evidence types for ${existing.serviceType}: ${missingTypes.join(", ")}. All of these must be uploaded before marking as completed.`);
      }
    }
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.update({
      where: { id: params.id },
      data: {
        srStatus: SrStatus.COMPLETED,
        status: "COMPLETED",
        resolutionNotes: parsed.data.resolutionNotes,
        resolvedAt: now,
        completedDate: now,
        closedAt: now,
      },
    });
    await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, SrStatus.COMPLETED, parsed.data.resolutionNotes);
    await writeOutboxEvent(tx, SR_EVENT_MAP[SrStatus.COMPLETED], { serviceRequestId: params.id, actorId: actor.userId }, params.id);
    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.completed",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: { srStatus: existing.srStatus },
    afterJson: { srStatus: updated.srStatus, resolvedAt: now },
  });

  const requesterIds = Array.from(new Set([existing.createdBy, existing.tenantUserId].filter((id): id is string => !!id)));
  await notify({
    organizationId: updated.organizationId,
    branchId: updated.branchId,
    roles: [],
    userIds: requesterIds,
    excludeUserId: actor.userId,
    type: "service_request.completed",
    severity: "info",
    title: "Your service request was completed",
    message: `"${updated.title}" has been marked completed.`,
    resourceType: "ServiceRequest",
    resourceId: updated.id,
    link: `/service-requests/${updated.id}`,
  });

  return Response.json({ data: updated });
});
