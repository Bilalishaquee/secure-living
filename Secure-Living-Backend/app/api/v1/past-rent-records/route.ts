import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().min(1),
  tenantId: z.string().min(1),
  unitId: z.string().min(1),
  propertyId: z.string().optional(),
  periodYear: z.number().int(),
  periodMonth: z.number().int().min(1).max(12),
  rentAmountKes: z.number(),
  paidAmountKes: z.number().default(0),
  balanceKes: z.number().default(0),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
  mpesaReference: z.string().optional(),
  notes: z.string().optional(),
  importJobId: z.string().optional(),
});

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

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.pastRentRecord.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      tenantId: body.tenantId,
      unitId: body.unitId,
      propertyId: body.propertyId ?? null,
      periodYear: body.periodYear,
      periodMonth: body.periodMonth,
      rentAmountKes: body.rentAmountKes,
      paidAmountKes: body.paidAmountKes,
      balanceKes: body.balanceKes,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidDate: body.paidDate ? new Date(body.paidDate) : null,
      paymentMethod: body.paymentMethod ?? null,
      mpesaReference: body.mpesaReference ?? null,
      notes: body.notes ?? null,
      importJobId: body.importJobId ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
