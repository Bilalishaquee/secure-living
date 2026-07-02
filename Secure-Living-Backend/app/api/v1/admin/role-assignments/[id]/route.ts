import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

// Restrict (suspend) or reinstate a manager's role assignment.
export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rbac:manage");
  if (denied) return denied;

  const existing = await prisma.userRoleAssignment.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Role assignment not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.userRoleAssignment.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: parsed.data.status === "suspended" ? "role_assignment.restricted" : "role_assignment.reinstated",
    resourceType: "UserRoleAssignment",
    resourceId: params.id,
    orgId: existing.organizationId,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
