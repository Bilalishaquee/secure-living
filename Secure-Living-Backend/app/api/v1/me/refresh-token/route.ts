import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";
import { buildUserAccess } from "@/lib/server/identity";
import { createAuthToken } from "@/lib/server/token";

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const access = await buildUserAccess(actor.userId);
  const token = createAuthToken({
    userId: actor.userId,
    email: actor.email,
    role: access.role,
    permissions: access.permissions,
    branchIds: access.branchIds,
    orgIds: access.orgIds,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  await prisma.apiSession.create({
    data: {
      token,
      userId: actor.userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return Response.json({
    data: {
      token,
      permissions: access.permissions,
      role: access.role,
    },
  });
});
