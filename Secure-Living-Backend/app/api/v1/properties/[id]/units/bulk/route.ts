import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

const bulkUnitSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  unitType: z.string().min(1),
  category: z.enum(["residential", "commercial", "industrial"]).default("residential"),
  rentAmountKes: z.number().nonnegative().optional(),
  depositAmountKes: z.number().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  sizeSqft: z.number().positive().optional(),
  isFurnished: z.boolean().default(false),
  parkingIncluded: z.boolean().default(false),
  floor: z.string().optional(),
  count: z.number().int().min(1).max(200),
  startingIdentifier: z.string().min(1),
  status: z.enum(["vacant", "occupied", "under_maintenance", "reserved", "unavailable"]).default("vacant"),
});

function nextIdentifier(base: string, offset: number): string {
  const m = base.match(/^([A-Za-z]*)(\d+)$/);
  if (m) return `${m[1]}${parseInt(m[2], 10) + offset}`;
  return offset === 0 ? base : `${base}${offset + 1}`;
}

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:create");
  if (denied) return denied;

  const parsed = await parseBody(req, bulkUnitSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const property = await prisma.property.findFirst({
    where: { id: params.id, organizationId: { in: actor.orgIds } },
  });
  if (!property) return Response.json({ error: "Property not found" }, { status: 404 });

  const existing = await prisma.unit.findMany({
    where: { propertyId: params.id },
    select: { unitNumber: true },
  });
  const existingNumbers = new Set(existing.map((u) => u.unitNumber));

  const units: {
    id: string;
    organizationId: string;
    branchId: string;
    propertyId: string;
    unitNumber: string;
    unitType: string;
    category: string;
    rentAmountKes?: number;
    depositAmountKes?: number;
    bedrooms?: number;
    bathrooms?: number;
    sizeSqft?: number;
    isFurnished: boolean;
    parkingBay?: string;
    floor?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];

  let offset = 0;
  while (units.length < body.count) {
    const num = nextIdentifier(body.startingIdentifier, offset);
    offset++;
    if (existingNumbers.has(num)) continue;
    units.push({
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      propertyId: params.id,
      unitNumber: num,
      unitType: body.unitType,
      category: body.category,
      rentAmountKes: body.rentAmountKes,
      depositAmountKes: body.depositAmountKes,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      sizeSqft: body.sizeSqft,
      isFurnished: body.isFurnished,
      parkingBay: body.parkingIncluded ? "TBD" : undefined,
      floor: body.floor,
      status: body.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (offset > body.count + 500) break;
  }

  await prisma.unit.createMany({ data: units });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "units.bulk_created",
    resourceType: "property",
    resourceId: params.id,
    orgId: body.organizationId,
    branchId: body.branchId,
    afterJson: { count: units.length, startingIdentifier: body.startingIdentifier },
  });

  return Response.json({ data: units, count: units.length }, { status: 201 });
})
