import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { createUnitSchema } from "@/lib/server/validation";
import { jsonError, parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:view");
  if (denied) return denied;

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return jsonError(404, "Property not found");
  const scoped = requireScope(actor, property.organizationId, property.branchId);
  if (scoped) return scoped;

  const units = await prisma.unit.findMany({
    where: { propertyId: params.id },
    orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
  });
  return Response.json({ data: units });
})

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:create");
  if (denied) return denied;

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return jsonError(404, "Property not found");
  const scoped = requireScope(actor, property.organizationId, property.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, createUnitSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.unit.create({
    data: {
      id: randomUUID(),
      organizationId: property.organizationId,
      branchId: property.branchId,
      propertyId: params.id,
      unitNumber: body.unitNumber,
      floor: body.floor,
      unitType: body.unitType,
      category: body.category ?? property.category,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      sizeSqft: body.sizeSqft,
      rentAmountKes: body.rentAmountKes,
      depositAmountKes: body.depositAmountKes,
      isFurnished: body.isFurnished ?? false,
      amenitiesCsv: body.amenities?.join(","),
      parkingBay: body.parkingBay,
      specialNotes: body.specialNotes,
      status: body.status,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "unit.created",
    resourceType: "unit",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
