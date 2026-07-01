import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  rentAmountKes: z.number().optional(),
  paidAmountKes: z.number().optional(),
  balanceKes: z.number().optional(),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().nullable().optional(),
  paymentMethod: z.string().optional(),
  mpesaReference: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.pastRentRecord.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");

  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.pastRentRecord.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.pastRentRecord.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.rentAmountKes !== undefined && { rentAmountKes: parsed.data.rentAmountKes }),
      ...(parsed.data.paidAmountKes !== undefined && { paidAmountKes: parsed.data.paidAmountKes }),
      ...(parsed.data.balanceKes !== undefined && { balanceKes: parsed.data.balanceKes }),
      ...(parsed.data.dueDate !== undefined && { dueDate: new Date(parsed.data.dueDate) }),
      ...(parsed.data.paidDate !== undefined && { paidDate: parsed.data.paidDate ? new Date(parsed.data.paidDate) : null }),
      ...(parsed.data.paymentMethod !== undefined && { paymentMethod: parsed.data.paymentMethod }),
      ...(parsed.data.mpesaReference !== undefined && { mpesaReference: parsed.data.mpesaReference }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.pastRentRecord.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  await prisma.pastRentRecord.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});
