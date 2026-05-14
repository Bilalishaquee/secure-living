import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const createBookingSchema = z.object({
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  guestIdNumber: z.string().optional(),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  numberOfGuests: z.number().int().positive().default(1),
  specialRequests: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:view");
  if (denied) return denied;

  const ssp = await prisma.shortStayProperty.findUnique({ where: { id: params.id } });
  if (!ssp) return jsonError(404, "Short-stay property not found");

  const orgId = actor.orgIds?.[0];
  if (ssp.organizationId !== orgId) return jsonError(403, "Forbidden");

  const rows = await prisma.shortStayBooking.findMany({
    where: { shortStayId: params.id },
    orderBy: { checkInDate: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:manage");
  if (denied) return denied;

  const ssp = await prisma.shortStayProperty.findUnique({ where: { id: params.id } });
  if (!ssp) return jsonError(404, "Short-stay property not found");

  const orgId = actor.orgIds?.[0];
  if (ssp.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, createBookingSchema);
  if (!parsed.ok) return parsed.response;

  const checkIn = new Date(parsed.data.checkInDate);
  const checkOut = new Date(parsed.data.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = nights * ssp.nightlyRate + ssp.cleaningFee;

  const booking = await prisma.shortStayBooking.create({
    data: {
      shortStayId: params.id,
      organizationId: ssp.organizationId,
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail,
      guestPhone: parsed.data.guestPhone,
      guestIdNumber: parsed.data.guestIdNumber,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: parsed.data.numberOfGuests,
      totalAmount,
      specialRequests: parsed.data.specialRequests,
      status: "CONFIRMED",
    },
  });

  return Response.json({ data: booking }, { status: 201 });
});
