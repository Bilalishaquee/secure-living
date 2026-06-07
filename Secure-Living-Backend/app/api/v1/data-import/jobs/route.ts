import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (!actor.permissions.includes("*")) {
    where.organizationId = { in: actor.orgIds };
  }

  const rows = await prisma.dataImportJob.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});
