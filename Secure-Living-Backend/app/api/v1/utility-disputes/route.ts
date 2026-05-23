import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

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

const adminDecideSchema = z.object({
  disputeId: z.string().min(1),
  correctedReading: z.number().optional(),
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

  return Response.json({ data: dispute }, { status: 201 });
});

// PATCH — landlord responds, or admin decides
export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const isAdmin = url.searchParams.get("admin") === "true";

  if (isAdmin) {
    const parsed = await parseBody(req, adminDecideSchema);
    if (!parsed.ok) return parsed.response;
    const { disputeId, correctedReading, decision } = parsed.data;

    const dispute = await prisma.utilityDispute.findUnique({ where: { id: disputeId } });
    if (!dispute) return jsonError(404, "Dispute not found");

    await prisma.utilityDispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED_ACCEPTED",
        adminDecision: decision,
        adminDecidedAt: new Date(),
        adminDecidedBy: actor.userId,
        resolvedAt: new Date(),
      },
    });

    if (correctedReading !== undefined) {
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

    return Response.json({ data: { message: "Admin decision recorded" } });
  }

  // Landlord response
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

  return Response.json({ data: { disputeId, action, status: newStatus } });
});
