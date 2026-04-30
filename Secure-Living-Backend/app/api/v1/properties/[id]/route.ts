import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { randomUUID } from "crypto";
import { jsonError, parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { updatePropertySchema } from "@/lib/server/validation";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "properties:view");
  if (denied) return denied;
  const row = await prisma.property.findUnique({
    where: { id: params.id },
    include: { roleAssignments: true },
  });
  if (!row) return jsonError(404, "Not found");
  const scoped = requireScope(actor, row.organizationId, row.branchId);
  if (scoped) return scoped;
  return Response.json({ data: row });
})

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:edit");
  if (denied) return denied;
  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");
  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, updatePropertySchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      ...b,
      acquisitionDate: b.acquisitionDate ? new Date(b.acquisitionDate) : undefined,
      insuranceExpiryDate: b.insuranceExpiryDate ? new Date(b.insuranceExpiryDate) : undefined,
      mortgageStartDate: b.mortgageStartDate ? new Date(b.mortgageStartDate) : undefined,
      mortgageMaturityDate: b.mortgageMaturityDate ? new Date(b.mortgageMaturityDate) : undefined,
      tagsCsv: b.tags ? b.tags.join(",") : undefined,
      amenitiesCsv: b.amenities ? b.amenities.join(",") : undefined,
      photosCsv: b.photos ? b.photos.join(",") : undefined,
      videosCsv: b.videos ? b.videos.join(",") : undefined,
    },
  });
  if (b.propertyRoles) {
    await prisma.propertyRoleAssignment.deleteMany({ where: { propertyId: params.id } });
    if (b.propertyRoles.length) {
      await prisma.propertyRoleAssignment.createMany({
        data: b.propertyRoles.map((r) => ({
          id: randomUUID(),
          propertyId: params.id,
          userId: r.userId,
          roleType: r.roleType,
        })),
      });
    }
  }

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "property.updated",
    resourceType: "property",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: existing,
    afterJson: updated,
  });
  return Response.json({ data: updated });
})
