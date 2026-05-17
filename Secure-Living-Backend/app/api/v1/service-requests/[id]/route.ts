import { z } from "zod";
import { SrStatus, SrPriority } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// ── GET ────────────────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:view");
  if (denied) return denied;

  const sr = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      srHistory: { orderBy: { changedAt: "desc" } },
      srAssignments: { orderBy: { assignedAt: "desc" } },
      escalations: { orderBy: { escalatedAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      evidences: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!sr) return jsonError(404, "Not found");

  const scoped = requireScope(actor, sr.organizationId, sr.branchId);
  if (scoped) return scoped;

  return Response.json({ data: sr });
});

// ── PUT ────────────────────────────────────────────────────────────────────────

const updateSrSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  description: z.string().min(5).max(5000).optional(),
  srPriority: z.nativeEnum(SrPriority).optional(),
  scheduledDate: z.string().datetime().optional(),
  internalNotes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  dueAt: z.string().datetime().optional(),
  guestAvailabilityWindow: z.string().optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  if (existing.srStatus !== SrStatus.DRAFT) {
    return jsonError(409, `Cannot edit service request in status ${existing.srStatus}. Only DRAFT requests can be edited.`);
  }

  const parsed = await parseBody(req, updateSrSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updated = await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.srPriority !== undefined ? { srPriority: body.srPriority } : {}),
      ...(body.scheduledDate !== undefined ? { scheduledDate: new Date(body.scheduledDate) } : {}),
      ...(body.internalNotes !== undefined ? { internalNotes: body.internalNotes } : {}),
      ...(body.metadata !== undefined ? { metadata: body.metadata as import("@prisma/client").Prisma.InputJsonValue } : {}),
      ...(body.dueAt !== undefined ? { dueAt: new Date(body.dueAt) } : {}),
      ...(body.guestAvailabilityWindow !== undefined ? { guestAvailabilityWindow: body.guestAvailabilityWindow } : {}),
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
});
