import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const notification = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notification) return jsonError(404, "Notification not found");
  if (notification.recipientId !== actor.userId) return jsonError(403, "Forbidden");

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true, readAt: new Date() },
  });

  return Response.json({ data: updated });
});
