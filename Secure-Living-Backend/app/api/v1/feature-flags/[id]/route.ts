import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  isEnabled: z.boolean().optional(),
  label: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "platform:feature-flags:manage");
  if (denied) return denied;

  const existing = await prisma.featureFlag.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Feature flag not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updated = await prisma.featureFlag.update({
    where: { id: params.id },
    data: {
      ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
      ...(body.label !== undefined && { label: body.label }),
      ...(body.description !== undefined && { description: body.description }),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "feature_flag.updated",
    resourceType: "FeatureFlag",
    resourceId: params.id,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "platform:feature-flags:manage");
  if (denied) return denied;

  const existing = await prisma.featureFlag.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Feature flag not found");

  await prisma.featureFlag.delete({ where: { id: params.id } });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "feature_flag.deleted",
    resourceType: "FeatureFlag",
    resourceId: params.id,
    beforeJson: existing,
  });

  return Response.json({ data: { deleted: true } });
});
