import { prisma } from "@/lib/server/db";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { jsonError, requireActor, withErrorHandler } from "@/lib/server/http";

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const body = (await req.json()) as { currentPassword?: string; newPassword?: string };
  if (!body.currentPassword || !body.newPassword) {
    return jsonError(400, "currentPassword and newPassword are required");
  }
  if (body.newPassword.length < 8) {
    return jsonError(400, "New password must be at least 8 characters");
  }

  const user = await prisma.appUser.findUnique({ where: { id: actor.userId } });
  if (!user) return jsonError(404, "User not found");

  if (!verifyPassword(body.currentPassword, user.passwordHash)) {
    return jsonError(401, "Current password is incorrect");
  }

  await prisma.appUser.update({
    where: { id: actor.userId },
    data: { passwordHash: hashPassword(body.newPassword) },
  });

  // Invalidate all existing sessions so user must re-login everywhere
  await prisma.apiSession.deleteMany({ where: { userId: actor.userId } });

  return Response.json({ data: { message: "Password changed successfully. Please log in again." } });
});