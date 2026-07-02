import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  const checklist = await prisma.tenantChecklist.findUnique({
    where: { id: params.id },
    include: { template: { include: { items: true } }, entries: true, lease: { select: { organizationId: true } } },
  });
  if (!checklist) return jsonError(404, "Checklist not found");
  if (checklist.status === "SIGNED") return jsonError(400, "Already signed");

  if (checklist.entries.length < checklist.template.items.length) {
    return jsonError(400, "All items must be filled before signing");
  }

  const updated = await prisma.tenantChecklist.update({
    where: { id: params.id },
    data: { status: "SIGNED", signedAt: new Date() },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "CHECKLIST_SIGNED",
    resourceType: "TenantChecklist",
    resourceId: updated.id,
    orgId: checklist.lease.organizationId,
    afterJson: { type: checklist.type, entryCount: checklist.entries.length },
  });

  return Response.json({ data: updated });
});
