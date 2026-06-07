import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const snapshotType = url.searchParams.get("snapshotType");

  const where: Record<string, unknown> = {};
  if (snapshotType) where.snapshotType = snapshotType;
  if (!actor.permissions.includes("*")) {
    where.organizationId = { in: actor.orgIds };
  }

  const rows = await prisma.liveIntelligenceSnapshot.findMany({
    where,
    orderBy: { generatedAt: "desc" },
  });

  return Response.json({ data: rows });
});
