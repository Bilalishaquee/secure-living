import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const updateSchema = z.object({
  assignmentStatus: z.enum(["assigned", "accepted", "completed", "cancelled"]).optional(),
  quotedAmount: z.number().nonnegative().optional(),
  agreedAmount: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});

type Ctx = { params: { id: string } };

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:update");
  if (denied) return denied;

  const existing = await prisma.jobAssignment.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.jobAssignment.update({
    where: { id: params.id },
    data: {
      assignmentStatus: parsed.data.assignmentStatus,
      quotedAmount: parsed.data.quotedAmount,
      agreedAmount: parsed.data.agreedAmount,
      notes: parsed.data.notes,
      acceptedAt: parsed.data.assignmentStatus === "accepted" ? new Date() : undefined,
      completedAt: parsed.data.assignmentStatus === "completed" ? new Date() : undefined,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "job_assignment.updated",
    resourceType: "job_assignment",
    resourceId: updated.id,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
})
