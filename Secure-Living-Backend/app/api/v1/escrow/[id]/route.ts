import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const row = await prisma.escrowAccount.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");
  return Response.json({ data: row });
})
