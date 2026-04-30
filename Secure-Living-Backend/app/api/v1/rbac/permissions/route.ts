import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rbac:manage");
  if (denied) return denied;
  const rows = await prisma.permission.findMany({ orderBy: { code: "asc" } });
  return Response.json({ data: rows });
})
