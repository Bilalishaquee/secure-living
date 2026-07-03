import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

// Tenant Portal "Request Renewal" (Update-2.md): the tenant can only ask for a renewal —
// the landlord still authors the actual renewal lease (see leases/[id]/renew).
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const lease = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!lease) return jsonError(404, "Lease not found");
  if (lease.tenantUserId !== actor.userId) return jsonError(403, "Only the tenant on this lease can request its renewal");
  if (lease.status !== "active") return jsonError(400, "Only an active lease can have a renewal requested");

  const updated = await prisma.lease.update({
    where: { id: params.id },
    data: { renewalRequestedAt: new Date() },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "LEASE_RENEWAL_REQUESTED",
    resourceType: "Lease",
    resourceId: lease.id,
    orgId: lease.organizationId,
    branchId: lease.branchId,
  });

  await notify({
    organizationId: lease.organizationId,
    excludeUserId: actor.userId,
    type: "lease.renewal_requested",
    severity: "info",
    title: "Tenant requested lease renewal",
    message: "A tenant has requested to renew their active lease.",
    resourceType: "Lease",
    resourceId: lease.id,
    link: `/leasing/${lease.id}`,
  });

  return Response.json({ data: updated });
});
