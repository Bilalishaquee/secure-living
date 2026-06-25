import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { ensureDepositEscrowForLease } from "@/lib/server/deposit";

const schema = z.object({
  leaseId: z.string().min(1),
  refundAmount: z.number().nonnegative(),
  voucherNumber: z.string().optional(),
});

function refundScoreFromDays(days: number, disputed: boolean) {
  if (disputed || days > 30) return "disputed";
  if (days > 14) return "late";
  return "prompt";
}

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const lease = await prisma.lease.findUnique({ where: { id: parsed.data.leaseId }, include: { vacatingNotice: true } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const escrow = await ensureDepositEscrowForLease(lease.id);
  if (!escrow) return jsonError(404, "Deposit record not found");
  if (parsed.data.refundAmount > escrow.currentBalance) return jsonError(400, "Refund exceeds available deposit balance");

  const noticeDate = lease.vacatingNotice?.noticeDate ?? new Date();
  const days = Math.floor((Date.now() - new Date(noticeDate).getTime()) / 86400000);
  const score = refundScoreFromDays(days, escrow.status === "disputed");

  const updated = await prisma.$transaction(async (tx) => {
    const dep = await tx.depositEscrow.update({
      where: { leaseId: lease.id },
      data: { status: "refunded", currentBalance: Math.max(0, escrow.currentBalance - parsed.data.refundAmount) },
    });
    if (escrow.landlordId) {
      const existing = await tx.landlordRefundScore.findUnique({ where: { landlordId: escrow.landlordId } });
      await tx.landlordRefundScore.upsert({
        where: { landlordId: escrow.landlordId },
        update: {
          score,
          totalRefunds: { increment: 1 },
          onTimeRefunds: { increment: score === "prompt" ? 1 : 0 },
          disputedRefunds: { increment: score === "disputed" ? 1 : 0 },
          lastUpdated: new Date(),
        },
        create: {
          landlordId: escrow.landlordId,
          score,
          totalRefunds: 1,
          onTimeRefunds: score === "prompt" ? 1 : 0,
          disputedRefunds: score === "disputed" ? 1 : 0,
          lastUpdated: new Date(),
        },
      });
      void existing;
    }
    return dep;
  });

  return Response.json({ data: { ...updated, voucherNumber: parsed.data.voucherNumber ?? null } });
});
