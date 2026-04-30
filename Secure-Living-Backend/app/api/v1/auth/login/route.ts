import { prisma } from "@/lib/server/db";
import { verifyPassword } from "@/lib/server/password";
import { createAuthToken } from "@/lib/server/token";
import { buildUserAccess } from "@/lib/server/identity";
import { jsonError , withErrorHandler } from "@/lib/server/http";

export const POST = withErrorHandler(async (req: Request) => {
  const body = (await req.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) return jsonError(400, "Email and password required");
  const user = await prisma.appUser.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !verifyPassword(body.password, user.passwordHash)) return jsonError(401, "Invalid credentials");
  if (user.status !== "active") return jsonError(403, "User is inactive");

  const access = await buildUserAccess(user.id);
  const token = createAuthToken({
    userId: user.id,
    email: user.email,
    role: access.role,
    permissions: access.permissions,
    branchIds: access.branchIds,
    orgIds: access.orgIds,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  await prisma.apiSession.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return Response.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: access.role,
        permissions: access.permissions,
        organizationId: access.orgIds[0] ?? null,
        branchId: access.branchIds[0] ?? null,
      },
    },
  });
})
