import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Condition Difference Engine — rank conditions so move-in -> move-out can be compared.
const CONDITION_RANK: Record<string, number> = {
  New: 5,
  Excellent: 4,
  Good: 3,
  Fair: 2,
  Poor: 1,
  Damaged: 0,
  Broken: 0,
  Missing: -1,
  "Not Applicable": 99,
};

function evaluate(statusIn: string | null, statusOut: string | null): {
  flag: "NO_ACTION" | "REVIEW_REQUIRED" | "POTENTIAL_DEDUCTION";
  changed: boolean;
} {
  const inRank = statusIn != null ? CONDITION_RANK[statusIn] ?? 3 : null;
  const outRank = statusOut != null ? CONDITION_RANK[statusOut] ?? 3 : null;

  if (statusOut === "Missing") return { flag: "POTENTIAL_DEDUCTION", changed: true };
  if (statusOut === "Damaged" || statusOut === "Broken") return { flag: "POTENTIAL_DEDUCTION", changed: true };

  if (inRank == null || outRank == null || inRank === 99 || outRank === 99) {
    return { flag: "NO_ACTION", changed: false };
  }
  if (outRank < inRank - 1) return { flag: "POTENTIAL_DEDUCTION", changed: true };
  if (outRank < inRank) return { flag: "REVIEW_REQUIRED", changed: true };
  return { flag: "NO_ACTION", changed: false };
}

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
    const { flag, changed } = evaluate(e.statusIn, e.statusOut);
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
      deductible: charge > 0 && e.responsibility !== "LANDLORD" && e.responsibility !== "WEAR_TEAR",
    };
  });

  const flaggedRows = rows.filter((r) => r.changed || r.chargeKes > 0);
  const totalCharges = rows.reduce((s, r) => s + r.chargeKes, 0);
  const totalDeductions = rows.filter((r) => r.deductible).reduce((s, r) => s + r.chargeKes, 0);

  const depositAmount = checklist.lease?.depositAmount ?? 0;
  const refundAmount = Math.max(0, depositAmount - totalDeductions);

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
