import { prisma } from "@/lib/server/db";
import { actorFromAuthorizationHeader } from "@/lib/server/authz";
import { jsonError, withErrorHandler } from "@/lib/server/http";
import { buildUserAccess } from "@/lib/server/identity";
import { createAuthToken } from "@/lib/server/token";

export const POST = withErrorHandler(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  let actor = actorFromAuthorizationHeader(authHeader);

  if (!actor) {
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = token
      ? await prisma.apiSession.findUnique({
          where: { token },
          include: { user: true },
        })
      : null;

    if (!session || session.expiresAt <= new Date() || session.user.status !== "active") {
      if (session?.expiresAt && session.expiresAt <= new Date()) {
        await prisma.apiSession.delete({ where: { token } }).catch(() => undefined);
      }
      return jsonError(401, "Unauthorized");
    }

    const access = await buildUserAccess(session.userId);
    actor = {
      userId: session.userId,
      email: session.user.email,
      role: access.role,
      permissions: access.permissions,
      branchIds: access.branchIds,
      orgIds: access.orgIds,
    };
  }

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
