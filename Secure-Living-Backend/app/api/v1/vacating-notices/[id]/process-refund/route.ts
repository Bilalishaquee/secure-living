import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const notice = await prisma.vacatingNotice.findUnique({
    where: { id: params.id },
    include: {
      inspection: { include: { deductions: true } },
      lease: { select: { depositAmount: true } },
      depositRefund: true,
    },
  });
  if (!notice) return jsonError(404, "Vacating notice not found");
  if (notice.status !== "INSPECTION_DONE") return jsonError(400, "Inspection not completed");
  if (notice.depositRefund) return jsonError(409, "Refund already processed");

  const orgId = actor.orgIds?.[0];
  if (notice.organizationId !== orgId) return jsonError(403, "Forbidden");

  const depositAmount = notice.lease?.depositAmount ?? 0;
  const totalDeductions = (notice.inspection?.deductions ?? []).reduce((s, d) => s + d.amount, 0);
  const refundAmount = Math.max(0, depositAmount - totalDeductions);

  const refund = await prisma.depositRefund.create({
    data: {
      vacatingNoticeId: params.id,
      organizationId: notice.organizationId,
      depositAmount,
      totalDeductions,
      refundAmount,
      status: "PENDING",
    },
  });

  await prisma.vacatingNotice.update({
    where: { id: params.id },
    data: { status: "DEPOSIT_PROCESSING" },
  });

  return Response.json({ data: refund }, { status: 201 });
});
