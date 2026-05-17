import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSlaPolicySchema = z.object({
  name: z.string().min(1).optional(),
  responseDeadlineMinutes: z.number().int().positive().optional(),
  completionDeadlineMinutes: z.number().int().positive().optional(),
  escalationAfterMinutes: z.number().int().positive().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const row = await prisma.slaPolicy.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "SLA policy not found");
  return Response.json({ data: row });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.slaPolicy.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "SLA policy not found");

  const parsed = await parseBody(req, updateSlaPolicySchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.slaPolicy.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.slaPolicy.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "SLA policy not found");

  // Check if any ServiceRequest references this slaPolicyId
  const inUse = await prisma.serviceRequest.findFirst({
    where: { slaPolicyId: params.id },
    select: { id: true },
  });
  if (inUse) {
    return jsonError(409, "Cannot delete SLA policy: it is referenced by one or more service requests");
  }

  await prisma.slaPolicy.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});
