import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "accounting:view");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  const rows = await prisma.monthlyRentSummary.findMany({
    where: { organizationId: orgId ?? undefined },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    take: 12,
  });

  return Response.json({ data: rows });
});
