import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const memberships = await prisma.userRoleAssignment.findMany({
    where: { userId: actor.userId, status: "active" },
    include: { organization: { include: { branches: true } } },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Set<string>();
  const orgs = memberships
    .map((m) => m.organization)
    .filter((org) => {
      if (seen.has(org.id)) return false;
      seen.add(org.id);
      return true;
    });

  return Response.json({ data: orgs });
});
