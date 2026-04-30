import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const invoices = await prisma.rentInvoice.findMany();
  const expected = invoices.reduce((s, i) => s + i.totalDueKes, 0);
  const paid = invoices.reduce((s, i) => s + i.amountPaidKes, 0);
  const overdue = invoices
    .filter((i) => i.balanceKes > 0 && i.dueDate < new Date())
    .reduce((s, i) => s + i.balanceKes, 0);
  return Response.json({
    data: {
      expectedKes: expected,
      collectedKes: paid,
      outstandingKes: expected - paid,
      overdueKes: overdue,
      collectionRate: expected > 0 ? Number(((paid / expected) * 100).toFixed(2)) : 0,
    },
  });
})
