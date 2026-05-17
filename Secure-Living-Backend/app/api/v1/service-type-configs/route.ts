import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createConfigSchema = z.object({
  serviceType: z.string().min(1),
  quoteRequired: z.boolean().default(false),
  supervisorApprovalRequired: z.boolean().default(false),
  evidenceRequirements: z.array(z.string()).default([]),
  assignmentRestrictions: z.string().default("open"),
  escrowRules: z.string().optional(),
  slaPolicyId: z.string().optional(),
});

// Public — no auth required (used at app boot)
export const GET = withErrorHandler(async (_req: Request) => {
  const rows = await prisma.serviceTypeConfig.findMany({ orderBy: { serviceType: "asc" } });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createConfigSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  // Upsert — one config per serviceType
  const row = await prisma.serviceTypeConfig.upsert({
    where: { serviceType: body.serviceType },
    update: {
      quoteRequired: body.quoteRequired,
      supervisorApprovalRequired: body.supervisorApprovalRequired,
      evidenceRequirements: body.evidenceRequirements,
      assignmentRestrictions: body.assignmentRestrictions,
      escrowRules: body.escrowRules ?? null,
      slaPolicyId: body.slaPolicyId ?? null,
    },
    create: {
      id: randomUUID(),
      serviceType: body.serviceType,
      quoteRequired: body.quoteRequired,
      supervisorApprovalRequired: body.supervisorApprovalRequired,
      evidenceRequirements: body.evidenceRequirements,
      assignmentRestrictions: body.assignmentRestrictions,
      escrowRules: body.escrowRules ?? null,
      slaPolicyId: body.slaPolicyId ?? null,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_type_config.upserted",
    resourceType: "service_type_config",
    resourceId: row.id,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
});
