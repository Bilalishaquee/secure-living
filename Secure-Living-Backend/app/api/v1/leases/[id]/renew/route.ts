import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { ensureDepositEscrowForLease } from "@/lib/server/deposit";
import { notify } from "@/lib/server/notify";

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

  // Lease Renewal Rules: an EXPIRED or TERMINATED lease can be renewed (the tenancy
  // lapsed or ended, but the landlord may still choose to re-offer the unit to the same
  // tenant), and an ACTIVE lease can be renewed ahead of its end date. A DECLINED lease
  // offer was never active, so it isn't "renewed" — the landlord sends a fresh offer via
  // the normal application/listing flow instead. There is no separate "cancelled" Lease
  // status: an offer that never got signed is "declined" (by the tenant) or simply left
  // as "offered"; an ended tenancy is "terminated" — both are handled here already.
  if (!["terminated", "expired", "active"].includes(existing.status)) {
    return jsonError(409, "Only active, expired, or terminated leases can be renewed");
  }

  const parsed = await parseBody(req, renewSchema);
  if (!parsed.ok) return parsed.response;

  // The renewal is itself a Lease Offer, not an auto-activated lease — it goes through
  // the same tenant Accept & Sign / Decline step as any other offer (Update-2.md: "the
  // tenant responds to the agreement, they don't author it" applies to renewals too).
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
      depositModel: existing.depositModel,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      paymentFrequency: parsed.data.paymentFrequency ?? existing.paymentFrequency,
      status: "offered",
      createdBy: actor.userId,
    },
  });

  await ensureDepositEscrowForLease(renewed.id);

  // Clear the source lease's renewal-requested flag now that the landlord has acted on
  // it, so the "Renewal Requested" banner doesn't linger once a new offer is out.
  if (existing.renewalRequestedAt) {
    await prisma.lease.update({ where: { id: existing.id }, data: { renewalRequestedAt: null } });
  }

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease.renewal_offered",
    resourceType: "lease",
    resourceId: renewed.id,
    orgId: renewed.organizationId,
    branchId: renewed.branchId,
    beforeJson: { sourceLeaseId: existing.id, sourceStatus: existing.status },
    afterJson: renewed,
  });

  await notify({
    roles: [],
    userIds: [renewed.tenantUserId],
    excludeUserId: actor.userId,
    type: "lease.renewal_offer_ready",
    severity: "info",
    title: "A lease renewal offer is ready for your review",
    message: "Your landlord has prepared renewal terms — review, accept & sign, or decline.",
    resourceType: "Lease",
    resourceId: renewed.id,
    link: "/tenant/lease",
  });

  return Response.json({ data: renewed }, { status: 201 });
});
