import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateDeliverySchema = z.object({
  deliveryChannel: z.string().optional(),
  deliveredAt: z.string().datetime().nullable().optional(),
  pdfUrl: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.rentReceipt.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");

  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.rentReceipt.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateDeliverySchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.rentReceipt.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.deliveryChannel !== undefined && { deliveryChannel: parsed.data.deliveryChannel }),
      ...(parsed.data.deliveredAt !== undefined && { deliveredAt: parsed.data.deliveredAt ? new Date(parsed.data.deliveredAt) : null }),
      ...(parsed.data.pdfUrl !== undefined && { pdfUrl: parsed.data.pdfUrl }),
    },
  });

  return Response.json({ data: updated });
});
