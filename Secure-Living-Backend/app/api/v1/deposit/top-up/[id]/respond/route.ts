import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const schema = z.object({
  action: z.enum(["accept", "dispute"]),
  note: z.string().optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:edit");
  if (denied) return denied;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const request = await prisma.depositTopUpRequest.findUnique({ where: { id: params.id } });
  if (!request) return jsonError(404, "Top-up request not found");

  const lease = await prisma.lease.findUnique({ where: { id: request.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const status = parsed.data.action === "accept" ? "accepted" : "disputed";
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.depositTopUpRequest.update({
      where: { id: params.id },
      data: {
        status,
        respondedBy: actor.userId,
        respondedAt: new Date(),
        disputeResolution: parsed.data.note,
      },
    });
    if (status === "accepted") {
      const escrow = await tx.depositEscrow.findUnique({ where: { leaseId: request.leaseId } });
      const previousLog = Array.isArray(escrow?.topUpLog) ? escrow.topUpLog : [];
      await tx.depositEscrow.update({
        where: { leaseId: request.leaseId },
        data: {
          currentBalance: { increment: request.amount },
          topUpLog: [
            ...previousLog,
            {
              amount: request.amount,
              initiator: request.requestedBy,
              reason: request.reason,
              accepted_by: actor.userId,
              date: new Date().toISOString(),
              transaction_reference: row.id,
            },
          ],
          healthStatus: "fully_covered",
        },
      });
    }
    return row;
  });

  return Response.json({ data: updated });
});
