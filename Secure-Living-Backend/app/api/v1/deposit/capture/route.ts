import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { DEPOSIT_MODEL_A, refreshDepositHealth } from "@/lib/server/deposit";

const schema = z.object({ leaseId: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:edit");
  if (denied) return denied;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const lease = await prisma.lease.findUnique({ where: { id: parsed.data.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const escrow = await refreshDepositHealth(lease.id);
  if (!escrow) return jsonError(404, "Deposit record not found");
  if (escrow.model !== DEPOSIT_MODEL_A) return jsonError(400, "Capture applies only to Landlord Reserve deposits");
  const obligation = lease.depositAmount ?? escrow.baseAmount;
  if (escrow.currentBalance < obligation) {
    return jsonError(409, `Deposit reserve shortfall: KES ${Math.round(obligation - escrow.currentBalance).toLocaleString("en-KE")}`);
  }

  const updated = await prisma.depositEscrow.update({
    where: { leaseId: lease.id },
    data: { status: "captured", currentBalance: obligation, healthStatus: "fully_covered" },
  });
  return Response.json({ data: updated });
});
