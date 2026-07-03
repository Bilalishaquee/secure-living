import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";
import { z } from "zod";

// UtilityDispute has no direct organizationId — trace reading -> meter -> unit for
// scoping notifications (and for the raiser's userId, already on the dispute itself).
// UtilityMeter has no Prisma relation to Unit (only a scalar unitId), so this is a
// 3-step lookup rather than a single nested include.
async function resolveDisputeOrg(readingId: string): Promise<string | null> {
  const reading = await prisma.utilityReading.findUnique({ where: { id: readingId } });
  if (!reading) return null;
  const meter = await prisma.utilityMeter.findUnique({ where: { id: reading.meterId } });
  if (!meter) return null;
  const unit = await prisma.unit.findUnique({ where: { id: meter.unitId } });
  return unit?.organizationId ?? null;
}

const raiseSchema = z.object({
  readingId: z.string().min(1),
  reason: z.enum(["high_reading", "wrong_unit", "previous_reading_mismatch", "other"]),
});

const respondSchema = z.object({
  disputeId: z.string().min(1),
  action: z.enum(["accept", "reject", "escalate"]),
  correctedReading: z.number().optional(),
  responseReason: z.string().min(1),
});

// Dispute Management (UPDATE.md): resolution is a distinct Approve / Decline / Other-resolution
// decision, always with a note, and only the party authorized to decide (dispute:resolve) may
// make the final call — see requirePermission(actor, "dispute:resolve") below.
const adminDecideSchema = z.object({
  disputeId: z.string().min(1),
  correctedReading: z.number().optional(),
  outcome: z.enum(["approve", "decline", "other"]),
  decision: z.string().min(1),
});

// GET — list disputes for a meter or property
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const meterId = url.searchParams.get("meterId");
  const readingId = url.searchParams.get("readingId");

  const disputes = await prisma.utilityDispute.findMany({
    where: {
      ...(readingId ? { readingId } : {}),
      ...(meterId ? { reading: { meterId } } : {}),
    },
    include: { reading: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json({ data: disputes });
});

// POST — tenant raises a dispute
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, raiseSchema);
  if (!parsed.ok) return parsed.response;
  const { readingId, reason } = parsed.data;

  const reading = await prisma.utilityReading.findUnique({ where: { id: readingId } });
  if (!reading) return jsonError(404, "Reading not found");

  // Cannot dispute older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (reading.createdAt < thirtyDaysAgo) {
    return jsonError(400, "Disputes can only be raised within 30 days of invoice generation");
  }

  const existing = await prisma.utilityDispute.findFirst({
    where: { readingId, status: { in: ["OPEN", "LANDLORD_RESPONDED", "ESCALATED"] } },
  });
  if (existing) return jsonError(400, "An open dispute already exists for this reading");

  const dispute = await prisma.utilityDispute.create({
    data: {
      readingId,
      raisedByUserId: actor.userId,
      reason,
      status: "OPEN",
    },
  });

  await prisma.utilityReading.update({
    where: { id: readingId },
    data: { isDisputed: true, disputeStatus: "OPEN" },
  });

  const orgId = await resolveDisputeOrg(readingId);
  await notify({
    organizationId: orgId,
    excludeUserId: actor.userId,
    type: "dispute.raised",
    severity: "warning",
    title: "New utility dispute raised",
    message: `A tenant disputed a utility reading (${reason.replace(/_/g, " ")}).`,
    resourceType: "UtilityDispute",
    resourceId: dispute.id,
    link: "/admin/disputes",
  });

  return Response.json({ data: dispute }, { status: 201 });
});

const appealSchema = z.object({
  disputeId: z.string().min(1),
  appealReason: z.string().min(1),
});

// PATCH — landlord responds, admin decides, or the raiser appeals a decline
export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const isAdmin = url.searchParams.get("admin") === "true";
  const isAppeal = url.searchParams.get("appeal") === "true";

  // Rectification Process (UPDATE.md): "Dispute Declined -> Appeal -> Review" — only the
  // person who originally raised the dispute can appeal, and only once (a dispute already
  // under appeal or resolved another way can't be appealed again).
  if (isAppeal) {
    const parsed = await parseBody(req, appealSchema);
    if (!parsed.ok) return parsed.response;

    const dispute = await prisma.utilityDispute.findUnique({ where: { id: parsed.data.disputeId } });
    if (!dispute) return jsonError(404, "Dispute not found");
    if (dispute.raisedByUserId !== actor.userId) return jsonError(403, "Only the person who raised this dispute can appeal it");
    if (dispute.status !== "RESOLVED_REJECTED") return jsonError(400, "Only a declined dispute can be appealed");

    const updated = await prisma.utilityDispute.update({
      where: { id: parsed.data.disputeId },
      data: { status: "UNDER_APPEAL", appealReason: parsed.data.appealReason, appealedAt: new Date() },
    });

    const orgId = await resolveDisputeOrg(dispute.readingId);
    await notify({
      organizationId: orgId,
      excludeUserId: actor.userId,
      type: "dispute.appealed",
      severity: "warning",
      title: "Dispute resolution appealed",
      message: "A tenant appealed a declined utility dispute decision.",
      resourceType: "UtilityDispute",
      resourceId: updated.id,
      link: "/admin/disputes",
    });

    return Response.json({ data: updated });
  }

  if (isAdmin) {
    const denied = requirePermission(actor, "dispute:resolve");
    if (denied) return denied;

    const parsed = await parseBody(req, adminDecideSchema);
    if (!parsed.ok) return parsed.response;
    const { disputeId, correctedReading, outcome, decision } = parsed.data;

    const dispute = await prisma.utilityDispute.findUnique({ where: { id: disputeId } });
    if (!dispute) return jsonError(404, "Dispute not found");
    if (dispute.status === "RESOLVED_ACCEPTED" || dispute.status === "RESOLVED_REJECTED" || dispute.status === "RESOLVED_OTHER") {
      return jsonError(400, "Dispute is already resolved");
    }

    const status = outcome === "approve" ? "RESOLVED_ACCEPTED" : outcome === "decline" ? "RESOLVED_REJECTED" : "RESOLVED_OTHER";

    await prisma.utilityDispute.update({
      where: { id: disputeId },
      data: {
        status,
        adminDecision: decision,
        adminDecidedAt: new Date(),
        adminDecidedBy: actor.userId,
        resolvedAt: new Date(),
      },
    });

    if (outcome === "approve" && correctedReading !== undefined) {
      const original = await prisma.utilityReading.findUnique({ where: { id: dispute.readingId } });
      if (original) {
        await prisma.utilityReading.create({
          data: {
            meterId: original.meterId,
            readingDate: original.readingDate,
            previousReading: original.previousReading,
            currentReading: correctedReading,
            consumption: correctedReading - original.previousReading,
            createdBy: actor.userId,
            originalReadingId: original.id,
            revisionReason: `Admin mediation: ${decision}`,
          },
        });
      }
    }

    await notify({
      roles: [],
      userIds: [dispute.raisedByUserId],
      excludeUserId: actor.userId,
      type: "dispute.resolved",
      severity: outcome === "decline" ? "warning" : "info",
      title: outcome === "approve" ? "Your dispute was approved" : outcome === "decline" ? "Your dispute was declined" : "Your dispute was resolved",
      message: decision,
      resourceType: "UtilityDispute",
      resourceId: disputeId,
      link: "/utilities",
    });

    return Response.json({ data: { message: `Dispute resolved: ${outcome}` } });
  }

  // Landlord response — first-line reply before an unresolved dispute reaches an admin decision.
  const respondDenied = requirePermission(actor, "dispute:respond");
  if (respondDenied) return respondDenied;

  const parsed = await parseBody(req, respondSchema);
  if (!parsed.ok) return parsed.response;
  const { disputeId, action, correctedReading, responseReason } = parsed.data;

  const dispute = await prisma.utilityDispute.findUnique({ where: { id: disputeId } });
  if (!dispute) return jsonError(404, "Dispute not found");
  if (dispute.status !== "OPEN") return jsonError(400, "Dispute is not open for landlord response");

  let newStatus: "LANDLORD_RESPONDED" | "ESCALATED" = "LANDLORD_RESPONDED";
  if (action === "escalate") newStatus = "ESCALATED";

  await prisma.utilityDispute.update({
    where: { id: disputeId },
    data: {
      status: newStatus,
      landlordResponse: responseReason,
      landlordRespondedAt: new Date(),
      ...(action === "accept" ? { resolvedAt: new Date(), status: "RESOLVED_ACCEPTED" } : {}),
      ...(action === "reject" ? { status: "RESOLVED_REJECTED", resolvedAt: new Date() } : {}),
    },
  });

  // If accepted, create corrected reading
  if (action === "accept" && correctedReading !== undefined) {
    const original = await prisma.utilityReading.findUnique({ where: { id: dispute.readingId } });
    if (original) {
      await prisma.utilityReading.create({
        data: {
          meterId: original.meterId,
          readingDate: original.readingDate,
          previousReading: original.previousReading,
          currentReading: correctedReading,
          consumption: correctedReading - original.previousReading,
          createdBy: actor.userId,
          originalReadingId: original.id,
          revisionReason: `Dispute accepted by landlord: ${responseReason}`,
        },
      });
    }
  }

  if (action === "escalate") {
    const orgId = await resolveDisputeOrg(dispute.readingId);
    await notify({
      organizationId: orgId,
      excludeUserId: actor.userId,
      type: "dispute.escalated",
      severity: "warning",
      title: "Utility dispute escalated",
      message: "A landlord escalated a utility dispute for admin decision.",
      resourceType: "UtilityDispute",
      resourceId: disputeId,
      link: "/admin/disputes",
    });
  } else {
    await notify({
      roles: [],
      userIds: [dispute.raisedByUserId],
      excludeUserId: actor.userId,
      type: "dispute.landlord_responded",
      severity: action === "reject" ? "warning" : "info",
      title: action === "accept" ? "Your dispute was accepted" : "Your dispute was rejected by the landlord",
      message: responseReason,
      resourceType: "UtilityDispute",
      resourceId: disputeId,
      link: "/utilities",
    });
  }

  return Response.json({ data: { disputeId, action, status: newStatus } });
});
