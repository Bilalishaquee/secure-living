import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

const schema = z.object({ leaseId: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const lease = await prisma.lease.findUnique({ where: { id: parsed.data.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const notice = await prisma.vacatingNotice.findUnique({
    where: { leaseId: lease.id },
    include: { inspection: { include: { deductions: true } } },
  });
  if (!notice?.inspection) return jsonError(404, "Move-out inspection not found");

  const totalDeductions = notice.inspection.deductions
    .filter((d) => d.responsibility === "TENANT")
    .reduce((sum, d) => sum + d.amount, 0);
  const depositAmount = lease.depositAmount ?? 0;

  return Response.json({
    data: {
      leaseId: lease.id,
      depositAmount,
      deductions: notice.inspection.deductions.map((d) => ({
        id: d.id,
        itemName: d.description,
        amount: d.amount,
        category: d.category,
        evidenceUrls: d.photoUrl ? [d.photoUrl] : [],
        status: d.status,
      })),
      totalDeductions,
      refundAmount: Math.max(0, depositAmount - totalDeductions),
    },
  });
});
