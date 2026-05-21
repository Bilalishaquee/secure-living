import { randomUUID } from "crypto";
import { z } from "zod";
import { SrStatus, ServiceRequestType, ServiceMode, SrCategory, SrPriority } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

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

  const booking = await prisma.shortStayBooking.findUnique({
    where: { id: params.bookingId },
    include: { shortStay: { include: { unit: { select: { id: true, branchId: true, propertyId: true } } } } },
  });
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

  // Auto-create CLEANING + INSPECTION service requests on checkout
  // and set unit readiness to PENDING_CLEAN
  const unit = booking.shortStay?.unit ?? null;
  const unitId = unit?.id ?? null;
  const branchId = unit?.branchId ?? actor.branchIds?.[0] ?? "";
  const propertyId = unit?.propertyId ?? null;

  const autoTypes: ServiceRequestType[] = [ServiceRequestType.CLEANING, ServiceRequestType.INSPECTION];
  await prisma.$transaction(async (tx) => {
    // Update unit readiness status
    if (unitId) {
      await tx.unit.update({
        where: { id: unitId },
        data: { readinessStatus: "PENDING_CLEAN" },
      });
    }

    for (const serviceType of autoTypes) {
      const srId = randomUUID();
      await tx.serviceRequest.create({
        data: {
          id: srId,
          organizationId: booking.organizationId,
          branchId,
          unitId,
          propertyId,
          title: `[Auto] Post-checkout ${serviceType === ServiceRequestType.CLEANING ? "Cleaning" : "Inspection"} — ${params.bookingId.slice(0, 8)}`,
          description: `Automatically created on guest checkout from booking ${params.bookingId}.`,
          serviceType,
          serviceMode: ServiceMode.MANAGED,
          srCategory: SrCategory.OPERATIONAL,
          srPriority: SrPriority.HIGH,
          requestSource: "WEB_PORTAL" as never,
          srStatus: SrStatus.SUBMITTED,
          status: "SUBMITTED",
          type: serviceType.toLowerCase(),
          category: "hospitality",
          priority: "high",
          shortStayBookingId: params.bookingId,
          createdBy: actor.userId,
        },
      });

      await writeSrTransition(tx, srId, "system", SrStatus.DRAFT, SrStatus.SUBMITTED, "Auto-created on guest checkout");
      await writeOutboxEvent(tx, "request.created", { serviceRequestId: srId, trigger: "checkout", bookingId: params.bookingId }, srId);
    }
  });

  return Response.json({ data: updated });
});
