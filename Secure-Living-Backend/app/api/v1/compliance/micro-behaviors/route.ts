import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const behaviorType = url.searchParams.get("behaviorType");

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (behaviorType) where.behaviorType = behaviorType;

  const rows = await prisma.microBehaviorRecord.findMany({
    where,
    orderBy: { detectedAt: "desc" },
  });

  return Response.json({ data: rows });
});
