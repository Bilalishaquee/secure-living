import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError , withErrorHandler } from "@/lib/server/http";
import { updateLeaseSchema } from "@/lib/server/validation";

type Ctx = { params: { id: string } };

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:edit");
  if (denied) return denied;

  const existing = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, updateLeaseSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.lease.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      signedAt: parsed.data.signedAt ? new Date(parsed.data.signedAt) : undefined,
      terminatedAt: parsed.data.terminatedAt ? new Date(parsed.data.terminatedAt) : undefined,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease.updated",
    resourceType: "lease",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
})
