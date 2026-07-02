import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

const linkSchema = z.object({
  legacyUnitId: z.string().min(1),
  unitId: z.string().min(1),
  tenantUserId: z.string().optional(),
});

// Links every PastRentRecord row sharing a given legacy unitId to a real Unit
// (and optionally a real tenant AppUser) in one go.
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "leases:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, linkSchema);
  if (!parsed.ok) return parsed.response;

  const orgId = actor.orgIds?.[0];
  const unit = await prisma.unit.findFirst({ where: { id: parsed.data.unitId, organizationId: orgId } });
  if (!unit) return jsonError(404, "Target unit not found in your organization");

  const result = await prisma.pastRentRecord.updateMany({
    where: { organizationId: orgId, unitId: parsed.data.legacyUnitId, linkStatus: "unlinked" },
    data: {
      linkStatus: "linked",
      linkedUnitId: unit.id,
      linkedTenantUserId: parsed.data.tenantUserId ?? null,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "MIGRATION_RECORDS_LINKED",
    resourceType: "PastRentRecord",
    resourceId: parsed.data.legacyUnitId,
    orgId: orgId ?? "",
    afterJson: { linkedUnitId: unit.id, count: result.count },
  });

  return Response.json({ data: { linkedCount: result.count, unitId: unit.id } });
});
