import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError , withErrorHandler } from "@/lib/server/http";
import { updateLeaseSchema } from "@/lib/server/validation";
import { refreshDepositHealth } from "@/lib/server/deposit";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:view");
  if (denied) return denied;

  const lease = await prisma.lease.findUnique({ where: { id: params.id }, include: { depositEscrow: true } });
  if (!lease) return jsonError(404, "Lease not found");

  // A tenant may only ever view their own lease, even within the same org/branch as others.
  if (actor.role === "tenant" && lease.tenantUserId !== actor.userId) return jsonError(403, "Forbidden");

  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const depositEscrow = await refreshDepositHealth(lease.id);

  // Same rationale as GET /leases — resolve a readable name/number without granting
  // broader unit:view access (see leases/route.ts comment).
  const [property, unit] = await Promise.all([
    prisma.property.findUnique({ where: { id: lease.propertyId }, select: { name: true } }),
    prisma.unit.findUnique({ where: { id: lease.unitId }, select: { unitNumber: true } }),
  ]);

  return Response.json({
    data: { ...lease, depositEscrow, propertyName: property?.name ?? null, unitNumber: unit?.unitNumber ?? null },
  });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:edit");
  if (denied) return denied;

  const existing = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, updateLeaseSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.lease.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      signedAt: parsed.data.signedAt ? new Date(parsed.data.signedAt) : undefined,
      terminatedAt: parsed.data.terminatedAt ? new Date(parsed.data.terminatedAt) : undefined,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease.updated",
    resourceType: "lease",
    resourceId: updated.id,
    orgId: updated.organizationId,
    branchId: updated.branchId,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
})
