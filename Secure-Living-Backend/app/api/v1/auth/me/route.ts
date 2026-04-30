import { prisma } from "@/lib/server/db";
import { requireActor , withErrorHandler } from "@/lib/server/http";
import { buildUserAccess } from "@/lib/server/identity";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const user = await prisma.appUser.findUnique({ where: { id: actor.userId } });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });
  const access = await buildUserAccess(user.id);
  return Response.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: access.role,
      permissions: access.permissions,
      organizationId: access.orgIds[0] ?? null,
      branchId: access.branchIds[0] ?? null,
    },
  });
})
