import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  unitId: z.string().min(1),
  propertyId: z.string().min(1),
  invoiceId: z.string().optional(),
  utilityReadingId: z.string().optional(),
  name: z.string().min(1),
  amountKes: z.number(),
  billingMethod: z.string().min(1),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  isLinkedToRent: z.boolean().default(true),
  evidenceUrl: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  amountKes: z.number().optional(),
  billingMethod: z.string().optional(),
  periodStart: z.string().datetime().nullable().optional(),
  periodEnd: z.string().datetime().nullable().optional(),
  isLinkedToRent: z.boolean().optional(),
  evidenceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const unitId = url.searchParams.get("unitId");
  const propertyId = url.searchParams.get("propertyId");
  const invoiceId = url.searchParams.get("invoiceId");

  const where: Record<string, unknown> = {};
  if (unitId) where.unitId = unitId;
  if (propertyId) where.propertyId = propertyId;
  if (invoiceId) where.invoiceId = invoiceId;

  const rows = await prisma.utilityHouseholdCharge.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.utilityHouseholdCharge.create({
    data: {
      id: randomUUID(),
      unitId: body.unitId,
      propertyId: body.propertyId,
      invoiceId: body.invoiceId ?? null,
      utilityReadingId: body.utilityReadingId ?? null,
      name: body.name,
      amountKes: body.amountKes,
      billingMethod: body.billingMethod,
      periodStart: body.periodStart ? new Date(body.periodStart) : null,
      periodEnd: body.periodEnd ? new Date(body.periodEnd) : null,
      isLinkedToRent: body.isLinkedToRent,
      evidenceUrl: body.evidenceUrl ?? null,
      notes: body.notes ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "id query parameter is required");

  const existing = await prisma.utilityHouseholdCharge.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "Not found");

  const updated = await prisma.utilityHouseholdCharge.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.amountKes !== undefined && { amountKes: parsed.data.amountKes }),
      ...(parsed.data.billingMethod !== undefined && { billingMethod: parsed.data.billingMethod }),
      ...(parsed.data.periodStart !== undefined && { periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null }),
      ...(parsed.data.periodEnd !== undefined && { periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null }),
      ...(parsed.data.isLinkedToRent !== undefined && { isLinkedToRent: parsed.data.isLinkedToRent }),
      ...(parsed.data.evidenceUrl !== undefined && { evidenceUrl: parsed.data.evidenceUrl }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  return Response.json({ data: updated });
});
