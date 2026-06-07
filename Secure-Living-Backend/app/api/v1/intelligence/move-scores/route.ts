import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const unitId = url.searchParams.get("unitId");

  const where: Record<string, unknown> = {};
  if (propertyId) where.propertyId = propertyId;
  if (unitId) where.unitId = unitId;

  const rows = await prisma.moveScoreRecord.findMany({
    where,
    orderBy: { generatedAt: "desc" },
  });

  return Response.json({ data: rows });
});
