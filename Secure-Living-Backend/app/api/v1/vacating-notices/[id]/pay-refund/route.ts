import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const paySchema = z.object({ voucherNumber: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const notice = await prisma.vacatingNotice.findUnique({
    where: { id: params.id },
    include: { depositRefund: true },
  });
  if (!notice) return jsonError(404, "Vacating notice not found");
  if (!notice.depositRefund) return jsonError(400, "Refund not yet processed");
  if (notice.depositRefund.status === "PAID") return jsonError(409, "Refund already paid");

  const orgId = actor.orgIds?.[0];
  if (notice.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, paySchema);
  if (!parsed.ok) return parsed.response;

  const refund = await prisma.depositRefund.update({
    where: { id: notice.depositRefund.id },
    data: { status: "PAID", voucherNumber: parsed.data.voucherNumber, paidAt: new Date() },
  });

  const deposit = await prisma.depositEscrow.findUnique({ where: { leaseId: notice.leaseId } });
  if (deposit) {
    const days = Math.floor((Date.now() - new Date(notice.noticeDate).getTime()) / 86400000);
    const score = days > 30 || notice.depositRefund.status === "DISPUTED" ? "disputed" : days > 14 ? "late" : "prompt";
    await prisma.depositEscrow.update({
      where: { leaseId: notice.leaseId },
      data: { status: "refunded", currentBalance: 0 },
    });
    if (deposit.landlordId) {
      await prisma.landlordRefundScore.upsert({
        where: { landlordId: deposit.landlordId },
        update: {
          score,
          totalRefunds: { increment: 1 },
          onTimeRefunds: { increment: score === "prompt" ? 1 : 0 },
          disputedRefunds: { increment: score === "disputed" ? 1 : 0 },
          lastUpdated: new Date(),
        },
        create: {
          landlordId: deposit.landlordId,
          score,
          totalRefunds: 1,
          onTimeRefunds: score === "prompt" ? 1 : 0,
          disputedRefunds: score === "disputed" ? 1 : 0,
        },
      });
    }
  }

  await prisma.vacatingNotice.update({
    where: { id: params.id },
    data: { status: "COMPLETED" },
  });

  // Set unit to listed/vacant
  await prisma.unit.update({
    where: { id: notice.unitId },
    data: { status: "vacant", currentTenantId: null, currentLeaseId: null },
  });

  // Terminate the lease
  await prisma.lease.update({
    where: { id: notice.leaseId },
    data: { status: "terminated", terminatedAt: new Date() },
  });

  return Response.json({ data: refund });
});
