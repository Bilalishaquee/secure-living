import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  recommendation: z.enum(["approve", "review", "decline"]).optional(),
  status: z.enum(["generated", "reviewed", "finalized"]).optional(),
  notes: z.string().optional(),
  riskFlagsJson: z.record(z.string(), z.any()).optional(),
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "screening:review");
  if (denied) return denied;

  const existing = await prisma.tenantScreeningReport.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Screening report not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.tenantScreeningReport.update({
    where: { id: params.id },
    data: {
      recommendation: parsed.data.recommendation ?? existing.recommendation,
      status: parsed.data.status ?? existing.status,
      notes: parsed.data.notes ?? existing.notes,
      riskFlagsJson: parsed.data.riskFlagsJson
        ? JSON.stringify(parsed.data.riskFlagsJson)
        : existing.riskFlagsJson,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "screening_report.updated",
    resourceType: "tenant_screening_report",
    resourceId: updated.id,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
