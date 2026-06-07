import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const shortStayId = url.searchParams.get("shortStayId");
  const bookingId = url.searchParams.get("bookingId");

  const where: Record<string, unknown> = {};
  if (shortStayId) where.shortStayId = shortStayId;
  if (bookingId) where.bookingId = bookingId;

  const rows = await prisma.otherCharge.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});
