import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const contexts = await prisma.userRoleContext.findMany({
    where: { userId: actor.userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ data: contexts });
});
