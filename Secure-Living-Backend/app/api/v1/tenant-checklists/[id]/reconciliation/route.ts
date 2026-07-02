import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { evaluateConditionChange, isDeductible, calculateRefund } from "@/lib/server/reconciliation";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  const checklist = await prisma.tenantChecklist.findUnique({
    where: { id: params.id },
    include: {
      entries: true,
      template: { include: { items: { orderBy: { order: "asc" } } } },
      lease: { select: { id: true, depositAmount: true } },
    },
  });
  if (!checklist) return jsonError(404, "Checklist not found");

  const itemById = new Map(checklist.template.items.map((i) => [i.id, i]));

  const rows = checklist.entries.map((e) => {
    const item = itemById.get(e.itemId);
    const { flag, changed } = evaluateConditionChange(e.statusIn, e.statusOut);
    const charge = e.chargeKes ?? 0;
    return {
      itemId: e.itemId,
      area: item?.section ?? null,
      item: item?.item ?? null,
      qty: e.qty,
      statusIn: e.statusIn,
      statusOut: e.statusOut,
      condition: e.condition,
      chargeKes: charge,
      responsibility: e.responsibility,
      actionRequired: e.actionRequired,
      note: e.note,
      flag,
      changed,
      // Only tenant-attributable charges count toward deductions.
      deductible: isDeductible(e),
    };
  });

  const flaggedRows = rows.filter((r) => r.changed || r.chargeKes > 0);
  const totalCharges = rows.reduce((s, r) => s + r.chargeKes, 0);
  const totalDeductions = rows.filter((r) => r.deductible).reduce((s, r) => s + r.chargeKes, 0);

  const depositAmount = checklist.lease?.depositAmount ?? 0;
  const refundAmount = calculateRefund(depositAmount, totalDeductions);

  return Response.json({
    data: {
      checklistId: checklist.id,
      type: checklist.type,
      depositAmount,
      totalCharges,
      totalDeductions,
      refundAmount,
      flaggedCount: flaggedRows.length,
      rows,
      flaggedRows,
    },
  });
});
