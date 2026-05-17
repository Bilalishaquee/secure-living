import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string; evidenceId: string } };

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const sr = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!sr) return jsonError(404, "Service request not found");

  const scoped = requireScope(actor, sr.organizationId, sr.branchId);
  if (scoped) return scoped;

  if (sr.srStatus !== SrStatus.DRAFT) {
    return jsonError(409, `Evidence can only be deleted when the service request is in DRAFT status. Current status: ${sr.srStatus}`);
  }

  const evidence = await prisma.serviceRequestEvidence.findUnique({ where: { id: params.evidenceId } });
  if (!evidence || evidence.serviceRequestId !== params.id) {
    return jsonError(404, "Evidence not found for this service request");
  }

  await prisma.serviceRequestEvidence.delete({ where: { id: params.evidenceId } });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.evidence_deleted",
    resourceType: "service_request_evidence",
    resourceId: params.evidenceId,
    orgId: sr.organizationId,
    branchId: sr.branchId,
    beforeJson: evidence,
  });

  return Response.json({ data: { deleted: true, id: params.evidenceId } });
});
