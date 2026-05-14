import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  const checklist = await prisma.tenantChecklist.findUnique({
    where: { id: params.id },
    include: {
      template: { include: { items: { orderBy: { order: "asc" } } } },
      entries: true,
    },
  });
  if (!checklist) return jsonError(404, "Checklist not found");

  return Response.json({ data: checklist });
});
