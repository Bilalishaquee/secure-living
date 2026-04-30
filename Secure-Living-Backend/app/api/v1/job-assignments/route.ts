import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError , withErrorHandler } from "@/lib/server/http";
import { createJobAssignmentSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:view");
  if (denied) return denied;

  const rows = await prisma.jobAssignment.findMany({
    orderBy: { assignedAt: "desc" },
    take: 200,
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:assign");
  if (denied) return denied;

  const parsed = await parseBody(req, createJobAssignmentSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const sr = await prisma.serviceRequest.findUnique({ where: { id: body.serviceRequestId } });
  if (!sr) return jsonError(404, "Service request not found");
  if (!["approved", "in_progress", "escalated"].includes(sr.status)) {
    return jsonError(409, "Service request must be approved before assignment");
  }
  const scoped = requireScope(actor, sr.organizationId, sr.branchId);
  if (scoped) return scoped;

  const row = await prisma.jobAssignment.create({
    data: {
      id: randomUUID(),
      serviceRequestId: body.serviceRequestId,
      professionalUserId: body.professionalUserId,
      assignmentStatus: "assigned",
      quotedAmount: body.quotedAmount,
      agreedAmount: body.agreedAmount,
      assignedBy: actor.userId,
      notes: body.notes,
    },
  });

  await prisma.serviceRequest.update({
    where: { id: body.serviceRequestId },
    data: {
      status: "in_progress",
      assignedToUserId: body.professionalUserId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "job_assignment.created",
    resourceType: "job_assignment",
    resourceId: row.id,
    orgId: sr.organizationId,
    branchId: sr.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
