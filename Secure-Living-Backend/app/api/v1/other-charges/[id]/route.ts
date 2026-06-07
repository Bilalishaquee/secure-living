import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  amountKes: z.number().optional(),
  chargeType: z.string().optional(),
  isRefundable: z.boolean().optional(),
  isOptional: z.boolean().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.otherCharge.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");

  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.otherCharge.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.otherCharge.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.amountKes !== undefined && { amountKes: parsed.data.amountKes }),
      ...(parsed.data.chargeType !== undefined && { chargeType: parsed.data.chargeType }),
      ...(parsed.data.isRefundable !== undefined && { isRefundable: parsed.data.isRefundable }),
      ...(parsed.data.isOptional !== undefined && { isOptional: parsed.data.isOptional }),
    },
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.otherCharge.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  await prisma.otherCharge.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});
