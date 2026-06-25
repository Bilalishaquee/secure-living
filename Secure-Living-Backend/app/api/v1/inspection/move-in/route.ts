import { z } from "zod";
import { ChecklistType } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

const schema = z.object({
  leaseId: z.string().min(1),
  gpsVerified: z.boolean().default(false),
  signedByTenant: z.boolean().default(false),
  signedByLandlord: z.boolean().default(false),
  checklistData: z.unknown(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:edit");
  if (denied) return denied;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const lease = await prisma.lease.findUnique({ where: { id: parsed.data.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  let template = await prisma.checklistTemplate.findFirst({
    where: { organizationId: lease.organizationId, category: "DEPOSIT_MOVE_IN" },
  });
  if (!template) {
    template = await prisma.checklistTemplate.create({
      data: {
        organizationId: lease.organizationId,
        name: "Deposit Move-In Checklist",
        description: "GPS verified move-in checklist for deposit deductions.",
        category: "DEPOSIT_MOVE_IN",
      },
    });
  }

  const checklist = await prisma.tenantChecklist.create({
    data: {
      leaseId: lease.id,
      unitId: lease.unitId,
      tenantId: lease.tenantUserId,
      templateId: template.id,
      type: ChecklistType.MOVE_IN,
      status: parsed.data.signedByTenant && parsed.data.signedByLandlord ? "SIGNED" : "PENDING",
      signedAt: parsed.data.signedByTenant && parsed.data.signedByLandlord ? new Date() : null,
      checklistData: parsed.data.checklistData as object,
      signedByTenant: parsed.data.signedByTenant,
      signedByLandlord: parsed.data.signedByLandlord,
      gpsVerified: parsed.data.gpsVerified,
    },
  });

  return Response.json({ data: checklist }, { status: 201 });
});
