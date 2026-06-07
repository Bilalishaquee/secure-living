import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  invoiceId: z.string().min(1),
  receiptNumber: z.string().optional(),
  tenantId: z.string().min(1),
  landlordId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  amountKes: z.number(),
  paymentMethod: z.string().min(1),
  mpesaReference: z.string().optional(),
  bankReference: z.string().optional(),
  deliveryChannel: z.string().optional(),
  notes: z.string().optional(),
});

function generateReceiptNumber(): string {
  const date = new Date();
  const yymm = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RCP-${yymm}-${rand}`;
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const invoiceId = url.searchParams.get("invoiceId");
  const tenantId = url.searchParams.get("tenantId");

  const where: Record<string, unknown> = {};
  if (invoiceId) where.invoiceId = invoiceId;
  if (tenantId) where.tenantId = tenantId;

  const rows = await prisma.rentReceipt.findMany({
    where,
    orderBy: { receiptDate: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.rentReceipt.create({
    data: {
      id: randomUUID(),
      invoiceId: body.invoiceId,
      receiptNumber: body.receiptNumber ?? generateReceiptNumber(),
      tenantId: body.tenantId,
      landlordId: body.landlordId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      amountKes: body.amountKes,
      paymentMethod: body.paymentMethod,
      mpesaReference: body.mpesaReference ?? null,
      bankReference: body.bankReference ?? null,
      deliveryChannel: body.deliveryChannel ?? null,
      notes: body.notes ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
