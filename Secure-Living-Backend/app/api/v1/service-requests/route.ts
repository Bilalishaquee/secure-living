import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { createServiceRequestSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:view");
  if (denied) return denied;

  const url = new URL(req.url);
  const branchId = url.searchParams.get("branchId");
  const orgId = url.searchParams.get("organizationId");

  const where =
    actor.permissions.includes("*")
      ? {
          ...(branchId ? { branchId } : {}),
          ...(orgId ? { organizationId: orgId } : {}),
        }
      : {
          branchId: { in: actor.branchIds },
          organizationId: { in: actor.orgIds },
          ...(branchId ? { branchId } : {}),
          ...(orgId ? { organizationId: orgId } : {}),
        };

  const rows = await prisma.serviceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createServiceRequestSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  const row = await prisma.serviceRequest.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      tenantUserId: body.tenantUserId,
      type: body.type,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      status: "draft",
      createdBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.created",
    resourceType: "service_request",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
