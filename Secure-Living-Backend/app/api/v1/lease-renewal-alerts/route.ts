import { randomUUID } from "crypto";
import { hasPermission } from "@/lib/server/authz";
import { appendAudit } from "@/lib/server/audit";
import { prisma } from "@/lib/server/db";
import { jsonError, requireActor , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "*") && !hasPermission(actor, "leases:view") && !hasPermission(actor, "properties:view")) {
    return jsonError(403, "Forbidden");
  }

  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 60);
  const rows = await prisma.leaseRenewalAlert.findMany({
    where: {
      status: "pending",
      expiryDate: { gte: now, lte: soon },
      ...(actor.permissions.includes("*")
        ? {}
        : { propertyId: { in: (await prisma.property.findMany({
          where: { organizationId: { in: actor.orgIds }, branchId: { in: actor.branchIds } },
          select: { id: true },
        })).map((p) => p.id) } }),
    },
    orderBy: { expiryDate: "asc" },
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "*") && !hasPermission(actor, "leases:manage") && !hasPermission(actor, "property:edit")) {
    return jsonError(403, "Forbidden");
  }
  const body = (await req.json()) as {
    leaseId: string;
    propertyId: string;
    unitId: string;
    tenantUserId: string;
    expiryDate: string;
    status?: string;
  };
  if (!body.leaseId || !body.propertyId || !body.unitId || !body.tenantUserId || !body.expiryDate) {
    return jsonError(400, "Missing required fields");
  }
  const prop = await prisma.property.findUnique({ where: { id: body.propertyId } });
  if (!prop) return jsonError(404, "Property not found");
  if (!actor.permissions.includes("*")) {
    if (!actor.orgIds.includes(prop.organizationId) || !actor.branchIds.includes(prop.branchId)) return jsonError(403, "Out of scope");
  }

  const row = await prisma.leaseRenewalAlert.create({
    data: {
      id: randomUUID(),
      leaseId: body.leaseId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      tenantUserId: body.tenantUserId,
      expiryDate: new Date(body.expiryDate),
      status: body.status ?? "pending",
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease_renewal_alert.created",
    resourceType: "lease_renewal_alert",
    resourceId: row.id,
    orgId: prop.organizationId,
    branchId: prop.branchId,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
})
