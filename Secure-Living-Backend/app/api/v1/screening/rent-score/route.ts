import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;

  const rows = await prisma.rentScoreRecord.findMany({
    where,
    orderBy: { lastUpdatedAt: "desc" },
  });

  return Response.json({ data: rows });
});
