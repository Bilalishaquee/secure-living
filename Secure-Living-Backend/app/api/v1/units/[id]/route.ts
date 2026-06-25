import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateUnitSchema = z.object({
  unitNumber: z.string().min(1).optional(),
  unitType: z.string().min(1).optional(),
  category: z.enum(["residential", "commercial", "industrial", "mixed_use"]).optional(),
  floor: z.string().nullable().optional(),
  bedrooms: z.number().int().nonnegative().nullable().optional(),
  bathrooms: z.number().nonnegative().nullable().optional(),
  sizeSqft: z.number().positive().nullable().optional(),
  rentAmountKes: z.number().nonnegative().nullable().optional(),
  depositAmountKes: z.number().nonnegative().nullable().optional(),
  isFurnished: z.boolean().optional(),
  parkingBay: z.string().nullable().optional(),
  specialNotes: z.string().nullable().optional(),
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
      ...(parsed.data.unitNumber !== undefined && { unitNumber: parsed.data.unitNumber }),
      ...(parsed.data.unitType !== undefined && { unitType: parsed.data.unitType }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category }),
      ...(parsed.data.floor !== undefined && { floor: parsed.data.floor }),
      ...(parsed.data.bedrooms !== undefined && { bedrooms: parsed.data.bedrooms }),
      ...(parsed.data.bathrooms !== undefined && { bathrooms: parsed.data.bathrooms }),
      ...(parsed.data.sizeSqft !== undefined && { sizeSqft: parsed.data.sizeSqft }),
      ...(parsed.data.rentAmountKes !== undefined && { rentAmountKes: parsed.data.rentAmountKes }),
      ...(parsed.data.depositAmountKes !== undefined && { depositAmountKes: parsed.data.depositAmountKes }),
      ...(parsed.data.isFurnished !== undefined && { isFurnished: parsed.data.isFurnished }),
      ...(parsed.data.parkingBay !== undefined && { parkingBay: parsed.data.parkingBay }),
      ...(parsed.data.specialNotes !== undefined && { specialNotes: parsed.data.specialNotes }),
      ...(parsed.data.readinessStatus !== undefined && { readinessStatus: parsed.data.readinessStatus as never }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.currentTenantId !== undefined && { currentTenantId: parsed.data.currentTenantId }),
      ...(parsed.data.currentLeaseId !== undefined && { currentLeaseId: parsed.data.currentLeaseId }),
    },
  });

  return Response.json({ data: updated });
});

export const PATCH = PUT;
