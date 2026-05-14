import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { bookingId: string } };

const checkOutSchema = z.object({
  stockUsage: z.array(z.object({
    stockItemId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).default([]),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:manage");
  if (denied) return denied;

  const booking = await prisma.shortStayBooking.findUnique({ where: { id: params.bookingId } });
  if (!booking) return jsonError(404, "Booking not found");
  if (booking.status !== "CHECKED_IN") return jsonError(400, "Guest is not checked in");

  const orgId = actor.orgIds?.[0];
  if (booking.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, checkOutSchema);
  if (!parsed.ok) return parsed.response;

  // Record stock usage and deduct from inventory
  for (const usage of parsed.data.stockUsage) {
    const stockItem = await prisma.stockItem.findUnique({ where: { id: usage.stockItemId } });
    if (!stockItem) continue;

    const totalCost = usage.quantity * stockItem.unitCost;
    await prisma.bookingStockUsage.create({
      data: { bookingId: params.bookingId, stockItemId: usage.stockItemId, quantity: usage.quantity, totalCost },
    });
    await prisma.stockItem.update({
      where: { id: usage.stockItemId },
      data: { quantityInStock: { decrement: usage.quantity } },
    });
  }

  const updated = await prisma.shortStayBooking.update({
    where: { id: params.bookingId },
    data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
    include: { stockUsage: { include: { stockItem: true } } },
  });

  return Response.json({ data: updated });
});
