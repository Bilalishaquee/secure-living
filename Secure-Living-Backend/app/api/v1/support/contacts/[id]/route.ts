import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";

type Ctx = { params: { id: string } };

// Contact Request workflow (UPDATE.md "Support Module Restructure Specification"):
// New -> Assigned -> Contacted -> Qualified -> Closed.
const updateSchema = z.object({
  status: z.enum(["NEW", "ASSIGNED", "CONTACTED", "QUALIFIED", "CLOSED"]).optional(),
  assignedTo: z.string().nullable().optional(),
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "support:manage");
  if (denied) return denied;

  const contact = await prisma.contactRequest.findUnique({ where: { id: params.id } });
  if (!contact) return jsonError(404, "Contact request not found");
  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  if (!isGlobal && contact.organizationId && !actor.orgIds.includes(contact.organizationId)) {
    return jsonError(403, "Forbidden");
  }

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const updated = await prisma.contactRequest.update({
    where: { id: params.id },
    data: {
      ...(b.status !== undefined && { status: b.status }),
      ...(b.assignedTo !== undefined && { assignedTo: b.assignedTo, ...(b.assignedTo && contact.status === "NEW" && { status: "ASSIGNED" }) }),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "contact_request.updated",
    resourceType: "contact_request",
    resourceId: updated.id,
    orgId: contact.organizationId ?? undefined,
    beforeJson: { status: contact.status, assignedTo: contact.assignedTo },
    afterJson: { status: updated.status, assignedTo: updated.assignedTo },
  });

  return Response.json({ data: updated });
});
