import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor , withErrorHandler } from "@/lib/server/http";

const importSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  entity: z.enum(["properties", "units", "tenants", "leases"]),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(1000),
});

type ImportResult = { imported: number; errors: { row: number; reason: string }[] };

async function importProperties(
  rows: Record<string, unknown>[],
  orgId: string,
  branchId: string,
  actorId: string
): Promise<ImportResult> {
  const errors: { row: number; reason: string }[] = [];
  let imported = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = String(r.name ?? r.Name ?? "").trim();
    const address = String(r.addressLine1 ?? r.address ?? r["Address Line 1"] ?? "").trim();
    const category = String(r.category ?? r.Category ?? "residential").toLowerCase();
    if (!name) { errors.push({ row: i + 1, reason: "Missing property name" }); continue; }
    if (!address) { errors.push({ row: i + 1, reason: "Missing address" }); continue; }
    const validCats = ["residential", "commercial", "industrial", "mixed_use"];
    const finalCat = validCats.includes(category) ? category : "residential";
    try {
      await prisma.property.create({
        data: {
          id: randomUUID(),
          organizationId: orgId,
          branchId,
          name,
          addressLine1: address,
          city: String(r.city ?? r.City ?? "").trim() || undefined,
          county: String(r.county ?? r.County ?? "").trim() || undefined,
          country: String(r.country ?? r.Country ?? "Kenya").trim() || "Kenya",
          propertyType: String(r.propertyType ?? r["Property Type"] ?? "Apartment Block").trim() as "Apartment Block",
          category: finalCat as "residential",
          gpsLatitude: r.gpsLatitude ? parseFloat(String(r.gpsLatitude)) : undefined,
          gpsLongitude: r.gpsLongitude ? parseFloat(String(r.gpsLongitude)) : undefined,
          status: "active",
          managementMode: "self_managed",
          createdBy: actorId,
        },
      });
      imported++;
    } catch (e) {
      errors.push({ row: i + 1, reason: String(e instanceof Error ? e.message : "DB error") });
    }
  }
  return { imported, errors };
}

async function importUnits(
  rows: Record<string, unknown>[],
  orgId: string,
  branchId: string
): Promise<ImportResult> {
  const errors: { row: number; reason: string }[] = [];
  let imported = 0;

  const properties = await prisma.property.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true },
  });
  const propMap = new Map(properties.map((p) => [p.name.toLowerCase(), p.id]));

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const propRef = String(r.propertyName ?? r.property ?? r["Property Name"] ?? "").trim();
    const unitNumber = String(r.unitNumber ?? r.unit ?? r["Unit Number"] ?? r["Unit ID"] ?? "").trim();
    if (!propRef) { errors.push({ row: i + 1, reason: "Missing property reference" }); continue; }
    if (!unitNumber) { errors.push({ row: i + 1, reason: "Missing unit number" }); continue; }
    const propId = propMap.get(propRef.toLowerCase());
    if (!propId) { errors.push({ row: i + 1, reason: `Property '${propRef}' not found` }); continue; }
    const existing = await prisma.unit.findFirst({ where: { propertyId: propId, unitNumber } });
    if (existing) { errors.push({ row: i + 1, reason: `Unit '${unitNumber}' already exists in property` }); continue; }
    try {
      await prisma.unit.create({
        data: {
          id: randomUUID(),
          organizationId: orgId,
          branchId,
          propertyId: propId,
          unitNumber,
          unitType: String(r.unitType ?? r["Unit Type"] ?? "1BR").trim(),
          category: String(r.category ?? "residential") as "residential",
          rentAmountKes: r.rentAmountKes ? parseFloat(String(r.rentAmountKes)) : undefined,
          depositAmountKes: r.depositAmountKes ? parseFloat(String(r.depositAmountKes)) : undefined,
          sizeSqft: r.sizeSqft ? parseFloat(String(r.sizeSqft)) : undefined,
          floor: String(r.floor ?? "").trim() || undefined,
          bedrooms: r.bedrooms ? parseInt(String(r.bedrooms), 10) : undefined,
          status: "vacant",
        },
      });
      imported++;
    } catch (e) {
      errors.push({ row: i + 1, reason: String(e instanceof Error ? e.message : "DB error") });
    }
  }
  return { imported, errors };
}

async function importTenants(
  rows: Record<string, unknown>[],
  orgId: string,
  branchId: string
): Promise<ImportResult> {
  const errors: { row: number; reason: string }[] = [];
  let imported = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const email = String(r.email ?? r.Email ?? "").trim().toLowerCase();
    const fullName = String(r.fullName ?? r.name ?? r["Full Name"] ?? r.Name ?? "").trim();
    if (!email || !fullName) {
      errors.push({ row: i + 1, reason: "Missing email or name" });
      continue;
    }
    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      errors.push({ row: i + 1, reason: `User with email '${email}' already exists` });
      continue;
    }
    try {
      const userId = randomUUID();
      await prisma.appUser.create({
        data: {
          id: userId,
          email,
          fullName,
          passwordHash: "imported_requires_reset",
          status: "active",
        },
      });
      const tenantRole = await prisma.role.findFirst({ where: { slug: "tenant" } });
      if (tenantRole) {
        await prisma.userRoleAssignment.create({
          data: {
            id: randomUUID(),
            userId,
            roleId: tenantRole.id,
            organizationId: orgId,
            branchId,
            status: "active",
          },
        });
      }
      imported++;
    } catch (e) {
      errors.push({ row: i + 1, reason: String(e instanceof Error ? e.message : "DB error") });
    }
  }
  return { imported, errors };
}

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, importSchema);
  if (!parsed.ok) return parsed.response;
  const { organizationId, branchId, entity, rows } = parsed.data;

  if (!actor.permissions.includes("*") && !actor.orgIds.includes(organizationId)) {
    return Response.json({ error: "Out of scope" }, { status: 403 });
  }

  let result: ImportResult;
  if (entity === "properties") {
    result = await importProperties(rows as Record<string, unknown>[], organizationId, branchId, actor.userId);
  } else if (entity === "units") {
    result = await importUnits(rows as Record<string, unknown>[], organizationId, branchId);
  } else if (entity === "tenants") {
    result = await importTenants(rows as Record<string, unknown>[], organizationId, branchId);
  } else {
    return Response.json({ error: "Lease import not yet supported via API — use unit/tenant import first" }, { status: 400 });
  }

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "import.completed",
    resourceType: entity,
    resourceId: organizationId,
    orgId: organizationId,
    branchId,
    afterJson: { entity, imported: result.imported, errors: result.errors.length },
  });

  return Response.json({ data: result }, { status: 200 });
})
