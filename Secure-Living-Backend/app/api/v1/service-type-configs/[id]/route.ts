import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateConfigSchema = z.object({
  quoteRequired: z.boolean().optional(),
  supervisorApprovalRequired: z.boolean().optional(),
  evidenceRequirements: z.array(z.string()).optional(),
  assignmentRestrictions: z.string().optional(),
  escrowRules: z.string().nullable().optional(),
  slaPolicyId: z.string().nullable().optional(),
});

export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  const row = await prisma.serviceTypeConfig.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Service type config not found");
  return Response.json({ data: row });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.serviceTypeConfig.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Service type config not found");

  const parsed = await parseBody(req, updateConfigSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updated = await prisma.serviceTypeConfig.update({
    where: { id: params.id },
    data: {
      ...(body.quoteRequired !== undefined && { quoteRequired: body.quoteRequired }),
      ...(body.supervisorApprovalRequired !== undefined && { supervisorApprovalRequired: body.supervisorApprovalRequired }),
      ...(body.evidenceRequirements !== undefined && { evidenceRequirements: body.evidenceRequirements }),
      ...(body.assignmentRestrictions !== undefined && { assignmentRestrictions: body.assignmentRestrictions }),
      ...(body.escrowRules !== undefined && { escrowRules: body.escrowRules }),
      ...(body.slaPolicyId !== undefined && { slaPolicyId: body.slaPolicyId }),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_type_config.updated",
    resourceType: "service_type_config",
    resourceId: params.id,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
