import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "audit:view");
  if (denied) return denied;

  const rows = await prisma.auditLog.findMany({
    where: actor.permissions.includes("*")
      ? {}
      : {
          OR: [{ branchId: { in: actor.branchIds } }, { orgId: { in: actor.orgIds } }],
        },
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  return Response.json({ data: rows });
})
