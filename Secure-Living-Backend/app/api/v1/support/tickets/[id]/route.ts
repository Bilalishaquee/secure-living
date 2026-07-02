import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";

type Ctx = { params: { id: string } };

// Support Ticket workflow (UPDATE.md "Support Module Restructure Specification"):
// New -> Assigned -> In Progress -> Awaiting User -> Resolved -> Closed.
// "Updates" is explicitly NOT a status — it's a timeline/notification concept, not
// represented as a ticket status here.
const updateSchema = z.object({
  status: z.enum(["NEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"]).optional(),
  assignedTo: z.string().nullable().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  internalNotes: z.string().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "support:manage");
  if (denied) return denied;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return jsonError(404, "Ticket not found");
  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  if (!isGlobal && ticket.organizationId && !actor.orgIds.includes(ticket.organizationId)) {
    return jsonError(403, "Forbidden");
  }

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const updated = await prisma.supportTicket.update({
    where: { id: params.id },
    data: {
      ...(b.status !== undefined && { status: b.status }),
      ...(b.assignedTo !== undefined && { assignedTo: b.assignedTo, ...(b.assignedTo && ticket.status === "NEW" && { status: "ASSIGNED" }) }),
      ...(b.priority !== undefined && { priority: b.priority }),
      ...(b.internalNotes !== undefined && { internalNotes: b.internalNotes }),
      ...(b.resolutionNotes !== undefined && { resolutionNotes: b.resolutionNotes }),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "support_ticket.updated",
    resourceType: "support_ticket",
    resourceId: updated.id,
    orgId: ticket.organizationId ?? undefined,
    beforeJson: { status: ticket.status, assignedTo: ticket.assignedTo },
    afterJson: { status: updated.status, assignedTo: updated.assignedTo },
  });

  return Response.json({ data: updated });
});
