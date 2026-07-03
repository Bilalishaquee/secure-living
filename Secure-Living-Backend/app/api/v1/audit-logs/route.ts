import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "audit:view");
  if (denied) return denied;

  const url = new URL(req.url);
  const resourceType = url.searchParams.get("resourceType") ?? undefined;
  const resourceId = url.searchParams.get("resourceId") ?? undefined;

  const rows = await prisma.auditLog.findMany({
    where: {
      ...(actor.permissions.includes("*")
        ? {}
        : { OR: [{ branchId: { in: actor.branchIds } }, { orgId: { in: actor.orgIds } }] }),
      ...(resourceType && { resourceType }),
      ...(resourceId && { resourceId }),
    },
    orderBy: { timestamp: "desc" },
    take: resourceId ? 100 : 500,
  });

  return Response.json({ data: rows });
})
