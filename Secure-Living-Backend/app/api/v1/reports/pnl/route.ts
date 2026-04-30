import { randomUUID } from "crypto";
import { hasPermission } from "@/lib/server/authz";
import { prisma } from "@/lib/server/db";
import { jsonError, requireActor , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "*") && !hasPermission(actor, "properties:view") && !hasPermission(actor, "accounting:view")) {
    return jsonError(403, "Forbidden");
  }

  const url = new URL(req.url);
  const periodStart = url.searchParams.get("periodStart");
  const periodEnd = url.searchParams.get("periodEnd");
  const propertyId = url.searchParams.get("propertyId");

  if (!periodStart || !periodEnd) return jsonError(400, "periodStart and periodEnd are required");

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const scopedPropertyIds = actor.permissions.includes("*")
    ? undefined
    : (
        await prisma.property.findMany({
          where: { organizationId: { in: actor.orgIds }, branchId: { in: actor.branchIds } },
          select: { id: true },
        })
      ).map((p) => p.id);

  const invoiceRows = await prisma.rentInvoice.findMany({
    where: {
      status: "paid",
      paidAt: { gte: start, lte: end },
      ...(propertyId ? { propertyId } : {}),
      ...(scopedPropertyIds ? { propertyId: { in: scopedPropertyIds } } : {}),
    },
    select: { amountPaidKes: true, propertyId: true },
  });

  const expenseRows = await prisma.expense.findMany({
    where: {
      deletedAt: null,
      date: { gte: start, lte: end },
      ...(propertyId ? { propertyId } : {}),
      ...(actor.permissions.includes("*")
        ? {}
        : {
            organizationId: { in: actor.orgIds },
            branchId: { in: actor.branchIds },
          }),
    },
    select: { amountKes: true, category: true, organizationId: true, branchId: true, propertyId: true },
  });

  const totalIncomeKes = invoiceRows.reduce((sum, i) => sum + i.amountPaidKes, 0);
  const totalExpenseKes = expenseRows.reduce((sum, e) => sum + e.amountKes, 0);
  const netKes = totalIncomeKes - totalExpenseKes;

  const expenseByCategory = expenseRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.amountKes;
    return acc;
  }, {});

  const organizationId = expenseRows[0]?.organizationId ?? actor.orgIds[0];
  const branchId = expenseRows[0]?.branchId ?? actor.branchIds[0];

  const reportPayload = {
    propertyId: propertyId ?? null,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    totalIncomeKes,
    totalExpenseKes,
    netKes,
    expenseByCategory,
  };

  if (organizationId && branchId) {
    await prisma.financialReport.create({
      data: {
        id: randomUUID(),
        organizationId,
        branchId,
        propertyId: propertyId ?? null,
        reportType: "profit_loss",
        periodStart: start,
        periodEnd: end,
        totalIncomeKes,
        totalExpenseKes,
        netKes,
        reportJson: JSON.stringify(reportPayload),
        generatedBy: actor.userId,
      },
    });
  }

  return Response.json({ data: reportPayload });
})
