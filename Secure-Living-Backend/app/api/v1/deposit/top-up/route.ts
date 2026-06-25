import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { DEPOSIT_MODEL_B2, ensureDepositEscrowForLease } from "@/lib/server/deposit";

const schema = z.object({
  leaseId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(3),
  requestedBy: z.enum(["tenant", "landlord", "system"]).optional(),
});

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
  if (lease.depositModel !== DEPOSIT_MODEL_B2) {
    return jsonError(400, "Top-ups are available only for Deposit Escrow model leases in this phase");
  }

  await ensureDepositEscrowForLease(lease.id);
  const row = await prisma.depositTopUpRequest.create({
    data: {
      leaseId: lease.id,
      organizationId: lease.organizationId,
      requestedBy: parsed.data.requestedBy ?? (actor.role === "tenant" ? "tenant" : "landlord"),
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      status: "pending",
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
