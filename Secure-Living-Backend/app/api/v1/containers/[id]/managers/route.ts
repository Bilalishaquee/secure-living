import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const assignManagerSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["manager", "caretaker", "accountant"]),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "container:edit");
  if (denied) return denied;

  const container = await prisma.container.findUnique({ where: { id: params.id } });
  if (!container) return jsonError(404, "Container not found");

  const orgId = actor.orgIds?.[0];
  if (container.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, assignManagerSchema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.containerManager.findFirst({
    where: { containerId: params.id, userId: parsed.data.userId },
  });
  if (existing) return jsonError(409, "User already assigned to this container");

  const row = await prisma.containerManager.create({
    data: {
      containerId: params.id,
      userId: parsed.data.userId,
      role: parsed.data.role,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
