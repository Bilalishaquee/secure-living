import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { createLeaseSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:view");
  if (denied) return denied;

  const where = actor.permissions.includes("*")
    ? {}
    : {
        branchId: { in: actor.branchIds },
        organizationId: { in: actor.orgIds },
      };

  const rows = await prisma.lease.findMany({ where, orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createLeaseSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  const row = await prisma.lease.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      tenantUserId: body.tenantUserId,
      leaseType: body.leaseType,
      rentAmount: body.rentAmount,
      depositAmount: body.depositAmount,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      paymentFrequency: body.paymentFrequency,
      status: "draft",
      createdBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease.created",
    resourceType: "lease",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
