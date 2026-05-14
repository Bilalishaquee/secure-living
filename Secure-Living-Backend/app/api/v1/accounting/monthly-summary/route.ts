import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createSummarySchema = z.object({
  periodYear: z.number().int(),
  periodMonth: z.number().int().min(1).max(12),
  openingBalance: z.number().default(0),
  totalRentDue: z.number().default(0),
  totalCollected: z.number().default(0),
  totalArrears: z.number().default(0),
  totalExpenses: z.number().default(0),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "accounting:view");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1));

  let summary = await prisma.monthlyRentSummary.findUnique({
    where: { organizationId_periodYear_periodMonth: { organizationId: orgId ?? "", periodYear: year, periodMonth: month } },
  });

  if (!summary && orgId) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const invoices = await prisma.rentInvoice.findMany({
      where: { periodStart: { gte: start }, periodEnd: { lte: end } },
    });
    const expenses = await prisma.expense.findMany({
      where: { organizationId: orgId, date: { gte: start, lte: end }, deletedAt: null },
    });

    const totalRentDue = invoices.reduce((s, i) => s + i.totalDueKes, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.amountPaidKes, 0);
    const totalArrears = invoices.filter((i) => i.status === "overdue" || i.status === "partial").reduce((s, i) => s + i.balanceKes, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amountKes, 0);
    const closingBalance = totalCollected - totalExpenses;

    summary = await prisma.monthlyRentSummary.create({
      data: {
        organizationId: orgId,
        periodYear: year,
        periodMonth: month,
        totalRentDue,
        totalCollected,
        totalArrears,
        totalExpenses,
        closingBalance,
      },
    });
  }

  return Response.json({ data: summary });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "accounting:manage");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  if (!orgId) return Response.json({ error: "No organization" }, { status: 400 });

  const parsed = await parseBody(req, createSummarySchema);
  if (!parsed.ok) return parsed.response;

  const closingBalance = parsed.data.openingBalance + parsed.data.totalCollected - parsed.data.totalExpenses;

  const summary = await prisma.monthlyRentSummary.upsert({
    where: { organizationId_periodYear_periodMonth: { organizationId: orgId, periodYear: parsed.data.periodYear, periodMonth: parsed.data.periodMonth } },
    create: { organizationId: orgId, ...parsed.data, closingBalance },
    update: { ...parsed.data, closingBalance },
  });

  return Response.json({ data: summary });
});
