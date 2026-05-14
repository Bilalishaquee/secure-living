import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const notice = await prisma.vacatingNotice.findUnique({ where: { id: params.id } });
  if (!notice) return jsonError(404, "Vacating notice not found");

  const orgId = actor.orgIds?.[0];
  if (notice.organizationId !== orgId) return jsonError(403, "Forbidden");

  if (notice.status !== "PENDING") return jsonError(400, "Notice is not in PENDING status");

  const updated = await prisma.vacatingNotice.update({
    where: { id: params.id },
    data: { status: "ACKNOWLEDGED" },
  });

  return Response.json({ data: updated });
});
