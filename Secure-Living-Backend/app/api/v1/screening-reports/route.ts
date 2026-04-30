import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { createScreeningReportSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "screening:view");
  if (denied) return denied;
  const rows = await prisma.tenantScreeningReport.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "screening:review");
  if (denied) return denied;
  const parsed = await parseBody(req, createScreeningReportSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const row = await prisma.tenantScreeningReport.create({
    data: {
      id: randomUUID(),
      applicationId: b.applicationId,
      applicantName: b.applicantName,
      nationalIdNumber: b.nationalIdNumber,
      score: b.score,
      recommendation: b.recommendation,
      riskFlagsJson: b.riskFlagsJson ? JSON.stringify(b.riskFlagsJson) : null,
      notes: b.notes,
      status: b.status,
      generatedBy: actor.userId,
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "screening_report.created",
    resourceType: "tenant_screening_report",
    resourceId: row.id,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
})
