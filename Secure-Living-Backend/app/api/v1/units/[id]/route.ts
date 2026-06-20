import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateUnitSchema = z.object({
  readinessStatus: z.enum(["READY", "PENDING_CLEAN", "PENDING_INSPECTION", "BLOCKED"]).optional(),
  status: z.string().optional(),
  currentTenantId: z.string().nullable().optional(),
  currentLeaseId: z.string().nullable().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:view");
  if (denied) return denied;
  const unit = await prisma.unit.findUnique({ where: { id: params.id } });
  if (!unit) return jsonError(404, "Unit not found");
  return Response.json({ data: unit });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:view");
  if (denied) return denied;

  const unit = await prisma.unit.findUnique({ where: { id: params.id } });
  if (!unit) return jsonError(404, "Unit not found");

  const parsed = await parseBody(req, updateUnitSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.unit.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.readinessStatus !== undefined && { readinessStatus: parsed.data.readinessStatus as never }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.currentTenantId !== undefined && { currentTenantId: parsed.data.currentTenantId }),
      ...(parsed.data.currentLeaseId !== undefined && { currentLeaseId: parsed.data.currentLeaseId }),
    },
  });

  return Response.json({ data: updated });
});

export const PATCH = PUT;