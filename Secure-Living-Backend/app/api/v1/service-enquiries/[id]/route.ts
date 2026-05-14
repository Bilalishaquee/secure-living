import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedTo: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-enquiry:manage");
  if (denied) return denied;

  const enquiry = await prisma.serviceEnquiry.findUnique({ where: { id: params.id } });
  if (!enquiry) return jsonError(404, "Enquiry not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.serviceEnquiry.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.status !== undefined && { status: parsed.data.status as never }),
      ...(parsed.data.assignedTo !== undefined && { assignedTo: parsed.data.assignedTo, assignedAt: parsed.data.assignedTo ? new Date() : null }),
      ...(parsed.data.internalNotes !== undefined && { internalNotes: parsed.data.internalNotes }),
      ...(parsed.data.status === "COMPLETED" && { resolvedAt: new Date() }),
    },
    include: { serviceCategory: { select: { name: true } } },
  });

  return Response.json({ data: updated });
});
