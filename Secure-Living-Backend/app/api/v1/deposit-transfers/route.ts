import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const listSchema = z.object({
  leaseId: z.string().min(1),
  depositAmountKes: z.number().positive(),
});

const paySchema = z.object({
  transferId: z.string().min(1),
});

const approveSchema = z.object({
  transferId: z.string().min(1),
});

const releaseSchema = z.object({
  transferId: z.string().min(1),
});

// GET — list available deposit transfers (incoming tenant browsing) or own
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const unitId = url.searchParams.get("unitId");
  const own = url.searchParams.get("own") === "true";

  const transfers = await prisma.depositTransfer.findMany({
    where: {
      ...(own ? { outgoingTenantId: actor.userId } : {}),
      ...(unitId ? { unitId } : {}),
      ...(!own ? { status: "LISTED" } : {}),
    },
    orderBy: { listedAt: "desc" },
    take: 50,
  });

  return Response.json({ data: transfers });
});

// POST /deposit-transfers — outgoing tenant lists their deposit
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, listSchema);
  if (!parsed.ok) return parsed.response;
  const { leaseId, depositAmountKes } = parsed.data;

  // Verify the lease belongs to this tenant
  const lease = await prisma.lease.findUnique({ where: { id: leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  if (lease.tenantUserId !== actor.userId) return jsonError(403, "You can only transfer your own deposit");

  // Check user is Level 1 verified
  const user = await prisma.appUser.findUnique({
    where: { id: actor.userId },
    select: { verificationLevel: true },
  });
  if (!user || user.verificationLevel === "UNVERIFIED") {
    return jsonError(403, "Level 1 identity verification is required to use deposit transfer");
  }

  // Verify deposit amount matches lease record
  if (lease.depositAmount && Math.abs(lease.depositAmount - depositAmountKes) > 1) {
    return jsonError(400, "Deposit amount must match the amount recorded in your signed lease");
  }

  // 30-day expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const transfer = await prisma.depositTransfer.create({
    data: {
      leaseId,
      outgoingTenantId: actor.userId,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      depositAmountKes,
      expiresAt,
    },
  });

  return Response.json({ data: transfer }, { status: 201 });
});

// PATCH — multi-step state transitions
export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "pay") {
    // Incoming tenant pays via escrow
    const parsed = await parseBody(req, paySchema);
    if (!parsed.ok) return parsed.response;
    const { transferId } = parsed.data;

    const transfer = await prisma.depositTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return jsonError(404, "Transfer not found");
    if (transfer.status !== "LISTED") return jsonError(400, "Transfer is not available");
    if (new Date() > transfer.expiresAt) return jsonError(400, "This deposit transfer listing has expired");

    // Check incoming tenant is Level 1 verified
    const incomingUser = await prisma.appUser.findUnique({
      where: { id: actor.userId },
      select: { verificationLevel: true },
    });
    if (!incomingUser || incomingUser.verificationLevel === "UNVERIFIED") {
      return jsonError(403, "Level 1 identity verification is required to pay a deposit transfer");
    }

    // In production: create escrow account and trigger M-Pesa payment
    await prisma.depositTransfer.update({
      where: { id: transferId },
      data: {
        status: "BUYER_PAID",
        incomingTenantId: actor.userId,
        buyerPaidAt: new Date(),
      },
    });

    return Response.json({ data: { message: "Payment recorded. Awaiting landlord approval." } });
  }

  if (action === "approve") {
    // Landlord approves incoming tenant
    const parsed = await parseBody(req, approveSchema);
    if (!parsed.ok) return parsed.response;
    const { transferId } = parsed.data;

    const transfer = await prisma.depositTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return jsonError(404, "Transfer not found");
    if (transfer.status !== "BUYER_PAID") return jsonError(400, "Payment must be received before approval");

    await prisma.depositTransfer.update({
      where: { id: transferId },
      data: { status: "LANDLORD_APPROVED", landlordApprovedAt: new Date() },
    });

    return Response.json({ data: { message: "Incoming tenant approved. Awaiting move-out inspection." } });
  }

  if (action === "release") {
    // System releases escrow to outgoing tenant after inspection
    const parsed = await parseBody(req, releaseSchema);
    if (!parsed.ok) return parsed.response;
    const { transferId } = parsed.data;

    const transfer = await prisma.depositTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return jsonError(404, "Transfer not found");
    if (transfer.status !== "INSPECTION_COMPLETE" && transfer.status !== "LANDLORD_APPROVED") {
      return jsonError(400, "Transfer is not ready for release");
    }

    // Deduct platform fee (KES 500)
    const releaseAmount = Number(transfer.depositAmountKes) - Number(transfer.platformFeeKes);

    await prisma.depositTransfer.update({
      where: { id: transferId },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
      },
    });

    return Response.json({
      data: {
        message: "Deposit released to outgoing tenant's wallet",
        releaseAmountKes: releaseAmount,
        platformFeeKes: Number(transfer.platformFeeKes),
      },
    });
  }

  return jsonError(400, "Invalid action. Use: pay, approve, release");
});
