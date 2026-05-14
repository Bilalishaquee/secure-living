import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { bookingId: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:manage");
  if (denied) return denied;

  const booking = await prisma.shortStayBooking.findUnique({ where: { id: params.bookingId } });
  if (!booking) return jsonError(404, "Booking not found");
  if (booking.status !== "CONFIRMED") return jsonError(400, "Booking is not in CONFIRMED status");

  const orgId = actor.orgIds?.[0];
  if (booking.organizationId !== orgId) return jsonError(403, "Forbidden");

  const updated = await prisma.shortStayBooking.update({
    where: { id: params.bookingId },
    data: { status: "CHECKED_IN", checkedInAt: new Date() },
  });

  return Response.json({ data: updated });
});
