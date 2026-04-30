import { hasPermission } from "@/lib/server/authz";
import { prisma } from "@/lib/server/db";
import { jsonError, requireActor , withErrorHandler } from "@/lib/server/http";

const OPERATING_CATEGORIES = new Set(["maintenance", "utilities", "management_fee", "hoa", "tax", "insurance"]);

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "*") && !hasPermission(actor, "properties:view") && !hasPermission(actor, "accounting:view")) {
    return jsonError(403, "Forbidden");
  }

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const year = Number(url.searchParams.get("year"));
  if (!propertyId || !Number.isFinite(year)) return jsonError(400, "propertyId and year are required");

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const invoices = await prisma.rentInvoice.findMany({
    where: {
      propertyId,
      status: "paid",
      paidAt: { gte: start, lte: end },
    },
    select: { amountPaidKes: true, paidAt: true },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      propertyId,
      deletedAt: null,
      date: { gte: start, lte: end },
      ...(actor.permissions.includes("*")
        ? {}
        : { organizationId: { in: actor.orgIds }, branchId: { in: actor.branchIds } }),
    },
    select: { amountKes: true, category: true, date: true },
  });

  const grossRentalIncomeKes = invoices.reduce((s, i) => s + i.amountPaidKes, 0);
  const operatingExpensesKes = expenses
    .filter((e) => OPERATING_CATEGORIES.has(e.category))
    .reduce((s, e) => s + e.amountKes, 0);
  const noiKes = grossRentalIncomeKes - operatingExpensesKes;

  const monthly = Array.from({ length: 12 }, (_, idx) => {
    const income = invoices
      .filter((i) => i.paidAt && new Date(i.paidAt).getUTCMonth() === idx)
      .reduce((s, i) => s + i.amountPaidKes, 0);
    const ops = expenses
      .filter((e) => OPERATING_CATEGORIES.has(e.category) && new Date(e.date).getUTCMonth() === idx)
      .reduce((s, e) => s + e.amountKes, 0);
    return {
      month: idx + 1,
      grossIncomeKes: income,
      operatingExpenseKes: ops,
      noiKes: income - ops,
    };
  });

  const expenseCategoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    if (OPERATING_CATEGORIES.has(e.category)) acc[e.category] = (acc[e.category] ?? 0) + e.amountKes;
    return acc;
  }, {});

  return Response.json({
    data: {
      propertyId,
      year,
      grossRentalIncomeKes,
      operatingExpensesKes,
      noiKes,
      monthly,
      expenseCategoryTotals,
    },
  });
})
