import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:view");
  if (denied) return denied;

  const provider = await prisma.serviceProvider.findUnique({
    where: { id: params.id },
    include: { auditLogs: { orderBy: { createdAt: "desc" } }, performance: true },
  });
  if (!provider) return jsonError(404, "Provider not found");

  return Response.json({ data: provider });
});

const updateProviderSchema = z.object({
  specializations: z.array(z.string()).optional(),
  coverageAreas: z.array(z.string()).optional(),
  bio: z.string().optional(),
  verificationLevel: z.string().optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.serviceProvider.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Provider not found");

  const parsed = await parseBody(req, updateProviderSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updated = await prisma.serviceProvider.update({
    where: { id: params.id },
    data: {
      ...(body.specializations !== undefined && { specializations: body.specializations }),
      ...(body.coverageAreas !== undefined && { coverageAreas: body.coverageAreas }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.verificationLevel !== undefined && { verificationLevel: body.verificationLevel }),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "provider.updated",
    resourceType: "service_provider",
    resourceId: params.id,
    orgId: existing.organizationId,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
