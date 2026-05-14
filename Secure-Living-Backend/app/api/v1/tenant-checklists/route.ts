import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") ?? actor.userId;

  const checklists = await prisma.tenantChecklist.findMany({
    where: { tenantId },
    include: {
      template: { select: { id: true, name: true, type: true } },
      entries: { include: { item: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: checklists });
});

const createChecklistSchema = z.object({
  leaseId: z.string().min(1),
  templateId: z.string().min(1),
  type: z.enum(["MOVE_IN", "MOVE_OUT"]),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createChecklistSchema);
  if (!parsed.ok) return parsed.response;

  const lease = await prisma.lease.findUnique({ where: { id: parsed.data.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");

  const checklist = await prisma.tenantChecklist.create({
    data: {
      leaseId: parsed.data.leaseId,
      unitId: lease.unitId,
      tenantId: lease.tenantUserId,
      templateId: parsed.data.templateId,
      type: parsed.data.type as never,
      status: "PENDING",
    },
  });

  return Response.json({ data: checklist }, { status: 201 });
});
