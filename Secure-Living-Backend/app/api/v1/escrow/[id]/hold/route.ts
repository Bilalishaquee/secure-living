import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;
  const row = await prisma.escrowAccount.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");
  const updated = await prisma.escrowAccount.update({
    where: { id: params.id },
    data: { status: "held", heldAt: new Date() },
  });
  return Response.json({ data: updated });
})
