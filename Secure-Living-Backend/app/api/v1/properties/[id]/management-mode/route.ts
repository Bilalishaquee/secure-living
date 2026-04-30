import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

const modeSchema = z.object({
  mode: z.enum(["self_managed", "full_service"]),
});

export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:create");
  if (denied) return denied;

  const parsed = await parseBody(req, modeSchema);
  if (!parsed.ok) return parsed.response;
  const { mode } = parsed.data;

  const property = await prisma.property.findFirst({
    where: { id: params.id, organizationId: { in: actor.orgIds } },
  });
  if (!property) return Response.json({ error: "Property not found" }, { status: 404 });

  if (mode === "self_managed" && property.managementMode === "full_service") {
    const openServiceRequests = await prisma.serviceRequest.count({
      where: {
        propertyId: params.id,
        status: { in: ["approved", "in_progress", "escalated"] },
      },
    });
    if (openServiceRequests > 0) {
      return Response.json(
        { error: `Cannot downgrade: ${openServiceRequests} active service request(s) must be resolved first.` },
        { status: 409 }
      );
    }
    const activeDisputes = await prisma.escrowAccount.count({
      where: { propertyId: params.id, status: "disputed" },
    });
    if (activeDisputes > 0) {
      return Response.json(
        { error: `Cannot downgrade: ${activeDisputes} active dispute(s) must be resolved first.` },
        { status: 409 }
      );
    }
  }

  const before = { managementMode: property.managementMode };
  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { managementMode: mode },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "property.management_mode_changed",
    resourceType: "property",
    resourceId: params.id,
    orgId: property.organizationId,
    branchId: property.branchId,
    beforeJson: before,
    afterJson: { managementMode: mode },
  });

  return Response.json({ data: updated });
})
