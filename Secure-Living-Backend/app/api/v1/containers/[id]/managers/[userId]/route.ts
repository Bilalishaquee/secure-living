import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string; userId: string } };

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "container:edit");
  if (denied) return denied;

  const container = await prisma.container.findUnique({ where: { id: params.id } });
  if (!container) return jsonError(404, "Container not found");

  const orgId = actor.orgIds?.[0];
  if (container.organizationId !== orgId) return jsonError(403, "Forbidden");

  const assignment = await prisma.containerManager.findFirst({
    where: { containerId: params.id, userId: params.userId },
  });
  if (!assignment) return jsonError(404, "Manager assignment not found");

  await prisma.containerManager.delete({ where: { id: assignment.id } });
  return Response.json({ data: { deleted: true } });
});
