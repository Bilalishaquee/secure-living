import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const scheduleSchema = z.object({ scheduledDate: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const notice = await prisma.vacatingNotice.findUnique({ where: { id: params.id } });
  if (!notice) return jsonError(404, "Vacating notice not found");

  const orgId = actor.orgIds?.[0];
  if (notice.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, scheduleSchema);
  if (!parsed.ok) return parsed.response;

  const inspection = await prisma.moveOutInspection.create({
    data: {
      vacatingNoticeId: params.id,
      organizationId: notice.organizationId,
      scheduledDate: new Date(parsed.data.scheduledDate),
      status: "PROPOSED",
    },
  });

  await prisma.vacatingNotice.update({
    where: { id: params.id },
    data: { status: "INSPECTION_SCHEDULED" },
  });

  return Response.json({ data: inspection }, { status: 201 });
});
