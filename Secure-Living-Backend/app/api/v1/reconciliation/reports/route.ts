import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const rows = await prisma.reconciliationReport.findMany({ orderBy: { runAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;

  const expected = (await prisma.transaction.aggregate({ _sum: { amountKes: true } }))._sum.amountKes ?? 0;
  const actual = (await prisma.ledgerEntry.aggregate({ _sum: { amountKes: true } }))._sum.amountKes ?? 0;
  const discrepancy = actual - expected;
  const row = await prisma.reconciliationReport.create({
    data: {
      id: randomUUID(),
      periodStart: new Date(new Date().setDate(new Date().getDate() - 30)),
      periodEnd: new Date(),
      expectedKes: expected,
      actualKes: actual,
      discrepancyKes: discrepancy,
      status: discrepancy === 0 ? "balanced" : "mismatch",
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
