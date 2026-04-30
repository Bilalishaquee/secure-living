import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError , withErrorHandler } from "@/lib/server/http";
import { updateServiceRequestSchema } from "@/lib/server/validation";
import { canApproveService, canEscalateService, canTransitionServiceStatus } from "@/lib/server/service-fsm";

type Ctx = { params: { id: string } };

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:update");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, updateServiceRequestSchema);
  if (!parsed.ok) return parsed.response;
  if (parsed.data.status && !canTransitionServiceStatus(existing.status, parsed.data.status)) {
    return jsonError(409, `Invalid status transition: ${existing.status} -> ${parsed.data.status}`);
  }
  if (parsed.data.status === "approved" && !canApproveService(actor)) {
    return jsonError(403, "Only approvers can approve a request");
  }
  if (parsed.data.status === "escalated" && !canEscalateService(actor)) {
    return jsonError(403, "Only escalation-capable users can escalate");
  }
  if (parsed.data.status === "escalated" && !parsed.data.escalatedReason) {
    return jsonError(400, "Escalation reason is required");
  }

  const updated = await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      approvedAt: parsed.data.status === "approved" ? new Date() : undefined,
      completedDate: parsed.data.status === "completed" ? new Date() : undefined,
      escalatedAt: parsed.data.status === "escalated" ? new Date() : undefined,
      closedAt: parsed.data.status === "completed" || parsed.data.status === "cancelled" ? new Date() : undefined,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.updated",
    resourceType: "service_request",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
})
