import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  // Find the most recent open (unresolved) escalation for this SR
  const openEscalation = await prisma.serviceRequestEscalation.findFirst({
    where: { serviceRequestId: params.id, resolvedAt: null },
    orderBy: { escalatedAt: "desc" },
  });

  if (!openEscalation) {
    return jsonError(404, "No open escalation found for this service request");
  }

  const now = new Date();
  const updated = await prisma.serviceRequestEscalation.update({
    where: { id: openEscalation.id },
    data: { resolvedAt: now },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.escalation_resolved",
    resourceType: "service_request",
    resourceId: params.id,
    orgId: existing.organizationId,
    branchId: existing.branchId,
    afterJson: { escalationId: openEscalation.id, resolvedAt: now },
  });

  return Response.json({ data: updated });
});
