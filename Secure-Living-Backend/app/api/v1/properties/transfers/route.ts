import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");

  const where: Record<string, unknown> = {};
  if (propertyId) where.propertyId = propertyId;

  const rows = await prisma.propertyTransferRecord.findMany({
    where,
    orderBy: { transferDate: "desc" },
  });

  return Response.json({ data: rows });
});
