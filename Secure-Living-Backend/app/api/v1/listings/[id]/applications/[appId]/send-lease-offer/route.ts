import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { ensureDepositEscrowForLease } from "@/lib/server/deposit";
import { appendAudit } from "@/lib/server/audit";

type Ctx = { params: { id: string; appId: string } };

// Send Lease Offer (Update-2.md "Why this matters" — the landlord/property manager
// authors the lease; the tenant only ever responds to it). Turns an accepted application
// into a Lease with status "offered" — it shows up on the tenant's "My Lease" page as a
// Lease Offer awaiting their signature, not as an active lease.
const sendOfferSchema = z.object({
  leaseType: z.enum(["fixed_term", "month_to_month"]),
  rentAmount: z.number().positive(),
  depositAmount: z.number().nonnegative().optional(),
  depositModel: z.enum(["LANDLORD_RESERVE", "DEPOSIT_ESCROW"]).default("LANDLORD_RESERVE"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  paymentFrequency: z.enum(["monthly", "quarterly"]),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:create");
  if (denied) return denied;

  const application = await prisma.rentalApplication.findUnique({
    where: { id: params.appId },
    include: { listing: { include: { unit: true } }, lease: true },
  });
  if (!application) return jsonError(404, "Application not found");
  if (application.listingId !== params.id) return jsonError(400, "Application does not belong to this listing");
  if (application.lease) return jsonError(409, "A lease has already been offered for this application");

  const unit = application.listing.unit;
  const scoped = requireScope(actor, unit.organizationId, unit.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, sendOfferSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const lease = await prisma.lease.create({
    data: {
      id: randomUUID(),
      organizationId: unit.organizationId,
      branchId: unit.branchId,
      propertyId: unit.propertyId,
      unitId: unit.id,
      tenantUserId: application.applicantId,
      applicationId: application.id,
      leaseType: body.leaseType,
      rentAmount: body.rentAmount,
      depositAmount: body.depositAmount,
      depositModel: body.depositModel,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      paymentFrequency: body.paymentFrequency,
      status: "offered",
      createdBy: actor.userId,
    },
  });

  await ensureDepositEscrowForLease(lease.id);

  if (application.status !== "ACCEPTED") {
    await prisma.rentalApplication.update({
      where: { id: application.id },
      data: { status: "ACCEPTED", reviewerId: actor.userId, reviewedAt: new Date() },
    });
  }

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "LEASE_OFFER_SENT",
    resourceType: "Lease",
    resourceId: lease.id,
    orgId: unit.organizationId,
    branchId: unit.branchId,
    afterJson: { applicationId: application.id, tenantUserId: application.applicantId },
  });

  return Response.json({ data: lease }, { status: 201 });
});
