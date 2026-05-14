import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "tenant:view");
  if (denied) return denied;

  const user = await prisma.appUser.findUnique({
    where: { id: params.id },
    select: { id: true, fullName: true, email: true },
  });
  if (!user) return jsonError(404, "User not found");

  return Response.json({ data: user });
});
