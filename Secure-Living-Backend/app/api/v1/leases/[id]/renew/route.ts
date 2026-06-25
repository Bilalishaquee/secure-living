import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const renewSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  rentAmount: z.number().positive().optional(),
  depositAmount: z.number().nonnegative().optional(),
  paymentFrequency: z.string().optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:create");
  if (denied) return denied;

  const existing = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Lease not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  if (!["terminated", "expired", "active"].includes(existing.status)) {
    return jsonError(409, "Only active, expired, or terminated leases can be renewed");
  }

  const parsed = await parseBody(req, renewSchema);
  if (!parsed.ok) return parsed.response;

  const renewed = await prisma.lease.create({
    data: {
      id: randomUUID(),
      organizationId: existing.organizationId,
      branchId: existing.branchId,
      propertyId: existing.propertyId,
      unitId: existing.unitId,
      tenantUserId: existing.tenantUserId,
      leaseType: existing.leaseType,
      rentAmount: parsed.data.rentAmount ?? existing.rentAmount,
      depositAmount: parsed.data.depositAmount ?? existing.depositAmount,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      paymentFrequency: parsed.data.paymentFrequency ?? existing.paymentFrequency,
      status: "draft",
      createdBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease.renewal_created",
    resourceType: "lease",
    resourceId: renewed.id,
    orgId: renewed.organizationId,
    branchId: renewed.branchId,
    beforeJson: { sourceLeaseId: existing.id, sourceStatus: existing.status },
    afterJson: renewed,
  });

  return Response.json({ data: renewed }, { status: 201 });
});
