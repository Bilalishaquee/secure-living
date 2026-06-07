import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const bulkCreateSchema = z.array(
  z.object({
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
  })
);

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, bulkCreateSchema);
  if (!parsed.ok) return parsed.response;

  const rows = await prisma.$transaction(
    parsed.data.map((body) =>
      prisma.pastRentRecord.create({
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
        },
      })
    )
  );

  return Response.json({ data: rows }, { status: 201 });
});
