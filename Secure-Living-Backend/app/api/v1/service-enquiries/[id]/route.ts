import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Workflow (UPDATE.md): Received -> Assigned -> Quotation Sent -> Accepted -> In Progress
// -> Completed -> Closed.
const updateSchema = z.object({
  status: z.enum(["RECEIVED", "ASSIGNED", "QUOTATION_SENT", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"]).optional(),
  assignedTo: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  quotationAmount: z.number().nonnegative().nullable().optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-enquiry:manage");
  if (denied) return denied;

  const enquiry = await prisma.serviceEnquiry.findUnique({ where: { id: params.id } });
  if (!enquiry) return jsonError(404, "Enquiry not found");
  if (!actor.permissions.includes("*") && !actor.orgIds.includes(enquiry.organizationId ?? "")) {
    return jsonError(403, "Forbidden");
  }

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.serviceEnquiry.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.status !== undefined && { status: parsed.data.status as never }),
      ...(parsed.data.assignedTo !== undefined && { assignedTo: parsed.data.assignedTo, assignedAt: parsed.data.assignedTo ? new Date() : null }),
      ...(parsed.data.internalNotes !== undefined && { internalNotes: parsed.data.internalNotes }),
      ...(parsed.data.quotationAmount !== undefined && { quotationAmount: parsed.data.quotationAmount }),
      ...((parsed.data.status === "COMPLETED" || parsed.data.status === "CLOSED") && { resolvedAt: new Date(), completionDate: new Date() }),
    },
    include: { serviceCategory: { select: { name: true } } },
  });

  return Response.json({ data: updated });
});

export const PATCH = PUT;
