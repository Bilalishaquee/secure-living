import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { refreshDepositHealth } from "@/lib/server/deposit";

type Ctx = { params: { leaseId: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:view");
  if (denied) return denied;

  const lease = await prisma.lease.findUnique({ where: { id: params.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const escrow = await refreshDepositHealth(lease.id);
  const obligation = lease.depositAmount ?? escrow?.baseAmount ?? 0;
  const balance = escrow?.currentBalance ?? 0;
  return Response.json({
    data: {
      leaseId: lease.id,
      model: lease.depositModel,
      depositAmount: obligation,
      currentBalance: balance,
      shortfallAmount: Math.max(0, obligation - balance),
      healthStatus: escrow?.healthStatus ?? "fully_covered",
      walletWatchActive: escrow?.walletWatchActive ?? false,
      status: escrow?.status ?? "active",
    },
  });
});
