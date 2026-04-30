import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;
  const hold = await prisma.fundHold.findUnique({ where: { id: params.id } });
  if (!hold) return jsonError(404, "Hold not found");
  await prisma.fundHold.update({
    where: { id: params.id },
    data: { isActive: false, releasedAt: new Date(), releasedByUserId: actor.userId },
  });
  return Response.json({ ok: true });
})
