import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const result = await prisma.notification.updateMany({
    where: { recipientId: actor.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return Response.json({ data: { updated: result.count } });
});
