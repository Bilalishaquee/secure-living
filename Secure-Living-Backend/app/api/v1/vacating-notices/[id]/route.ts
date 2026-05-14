import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:view");
  if (denied) return denied;

  const notice = await prisma.vacatingNotice.findUnique({
    where: { id: params.id },
    include: {
      inspection: { include: { deductions: true } },
      depositRefund: true,
    },
  });
  if (!notice) return jsonError(404, "Vacating notice not found");

  const orgId = actor.orgIds?.[0];
  if (notice.organizationId !== orgId) return jsonError(403, "Forbidden");

  return Response.json({ data: notice });
});
