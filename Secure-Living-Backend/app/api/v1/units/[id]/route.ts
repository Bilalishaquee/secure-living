import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateUnitSchema = z.object({
  unitType: z.string().min(1).optional(),
  category: z.enum(["residential", "commercial", "industrial"]).optional(),
  floor: z.string().nullable().optional(),
  rentAmountKes: z.number().nonnegative().nullable().optional(),
  depositAmountKes: z.number().nonnegative().nullable().optional(),
  bedrooms: z.number().int().nonnegative().nullable().optional(),
  bathrooms: z.number().nonnegative().nullable().optional(),
  sizeSqft: z.number().positive().nullable().optional(),
  isFurnished: z.boolean().optional(),
  parkingBay: z.string().nullable().optional(),
  specialNotes: z.string().max(500).nullable().optional(),
  status: z.enum(["vacant", "occupied", "under_maintenance", "reserved", "unavailable"]).optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:view");
  if (denied) return denied;

  const unit = await prisma.unit.findUnique({ where: { id: params.id } });
  if (!unit) return jsonError(404, "Unit not found");

  const scoped = requireScope(actor, unit.organizationId, unit.branchId);
  if (scoped) return scoped;

  return Response.json({ data: unit });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:create");
  if (denied) return denied;

  const existing = await prisma.unit.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Unit not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, updateUnitSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updated = await prisma.unit.update({
    where: { id: params.id },
    data: {
      unitType: body.unitType,
      category: body.category ?? undefined,
      floor: body.floor,
      rentAmountKes: body.rentAmountKes,
      depositAmountKes: body.depositAmountKes,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      sizeSqft: body.sizeSqft,
      isFurnished: body.isFurnished,
      parkingBay: body.parkingBay,
      specialNotes: body.specialNotes,
      status: body.status,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "unit.updated",
    resourceType: "unit",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
