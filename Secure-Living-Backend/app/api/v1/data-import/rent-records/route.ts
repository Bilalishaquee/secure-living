import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const unitId = url.searchParams.get("unitId");

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (unitId) where.unitId = unitId;

  if (!actor.permissions.includes("*")) {
    where.organizationId = { in: actor.orgIds };
  }

  const rows = await prisma.pastRentRecord.findMany({
    where,
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const body = (await req.json().catch(() => null)) as {
    organizationId?: string;
    tenantId?: string;
    unitId?: string;
    propertyId?: string;
    periodYear?: number;
    periodMonth?: number;
    rentAmountKes?: number;
    paidAmountKes?: number;
    balanceKes?: number;
    dueDate?: string;
    paidDate?: string;
    paymentMethod?: string;
    mpesaReference?: string;
    notes?: string;
  } | null;
  if (!body || !body.tenantId || !body.unitId || !body.periodYear || !body.periodMonth || body.rentAmountKes == null) {
    return jsonError(400, "tenantId, unitId, periodYear, periodMonth, rentAmountKes are required");
  }

  const organizationId = body.organizationId || actor.orgIds?.[0];
  if (!organizationId) return jsonError(400, "organizationId is required");

  const rent = body.rentAmountKes;
  const paid = body.paidAmountKes ?? 0;
  const balance = body.balanceKes ?? Math.max(0, rent - paid);

  const row = await prisma.pastRentRecord.create({
    data: {
      id: randomUUID(),
      organizationId,
      tenantId: body.tenantId,
      unitId: body.unitId,
      propertyId: body.propertyId ?? null,
      periodYear: body.periodYear,
      periodMonth: body.periodMonth,
      rentAmountKes: rent,
      paidAmountKes: paid,
      balanceKes: balance,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidDate: body.paidDate ? new Date(body.paidDate) : null,
      paymentMethod: body.paymentMethod ?? null,
      mpesaReference: body.mpesaReference ?? null,
      notes: body.notes ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
