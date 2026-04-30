import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { createUnitSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:view");
  if (denied) return denied;
  const where = actor.permissions.includes("*")
    ? {}
    : { organizationId: { in: actor.orgIds }, branchId: { in: actor.branchIds } };
  const rows = await prisma.unit.findMany({ where, orderBy: { updatedAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:create");
  if (denied) return denied;
  const parsed = await parseBody(req, createUnitSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;
  const row = await prisma.unit.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      propertyId: body.propertyId,
      unitNumber: body.unitNumber,
      floor: body.floor,
      unitType: body.unitType,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      sizeSqft: body.sizeSqft,
      rentAmountKes: body.rentAmountKes,
      depositAmountKes: body.depositAmountKes,
      isFurnished: body.isFurnished ?? false,
      amenitiesCsv: body.amenities?.join(","),
      category: body.category ?? "residential",
      parkingBay: body.parkingBay,
      specialNotes: body.specialNotes,
      status: body.status,
      currentTenantId: body.currentTenantId,
      currentLeaseId: body.currentLeaseId,
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
