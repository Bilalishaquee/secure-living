import { hasPermission } from "@/lib/server/authz";
import { appendAudit } from "@/lib/server/audit";
import { prisma } from "@/lib/server/db";
import { jsonError, requireActor , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "*") && !hasPermission(actor, "leases:manage") && !hasPermission(actor, "property:edit")) {
    return jsonError(403, "Forbidden");
  }
  const existing = await prisma.leaseRenewalAlert.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");
  const prop = await prisma.property.findUnique({ where: { id: existing.propertyId } });
  if (!prop) return jsonError(404, "Property not found");
  if (!actor.permissions.includes("*")) {
    if (!actor.orgIds.includes(prop.organizationId) || !actor.branchIds.includes(prop.branchId)) return jsonError(403, "Out of scope");
  }
  const body = (await req.json()) as { status?: "pending" | "sent" | "renewed" | "expired"; alertSentAt?: string };
  if (!body.status && !body.alertSentAt) return jsonError(400, "No changes supplied");

  const row = await prisma.leaseRenewalAlert.update({
    where: { id: params.id },
    data: {
      status: body.status ?? undefined,
      alertSentAt: body.alertSentAt ? new Date(body.alertSentAt) : undefined,
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease_renewal_alert.updated",
    resourceType: "lease_renewal_alert",
    resourceId: row.id,
    orgId: prop.organizationId,
    branchId: prop.branchId,
    beforeJson: existing,
    afterJson: row,
  });
  return Response.json({ data: row });
})
