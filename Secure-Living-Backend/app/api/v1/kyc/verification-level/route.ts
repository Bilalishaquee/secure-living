import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

// GET /api/v1/kyc/verification-level — current user's verification state
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const user = await prisma.appUser.findUnique({
    where: { id: actor.userId },
    select: {
      verificationLevel: true,
      verificationLevelSetAt: true,
      iprsCheckedAt: true,
      iprsResult: true,
      trustedPersonnelStatus: true,
      goodConductExpiresAt: true,
      trustedPersonnelReviewedAt: true,
      kycDocuments: {
        orderBy: { uploadedAt: "desc" },
        take: 10,
        select: { id: true, documentType: true, status: true, uploadedAt: true },
      },
    },
  });

  if (!user) return jsonError(404, "User not found");
  return Response.json({ data: user });
});

// POST /api/v1/kyc/verification-level/initiate — start Didit.me Level 1 flow
const initiateSchema = z.object({
  action: z.enum(["initiate_level1", "check_iprs"]),
  consentGiven: z.boolean().optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, initiateSchema);
  if (!parsed.ok) return parsed.response;
  const { action, consentGiven } = parsed.data;

  const user = await prisma.appUser.findUnique({
    where: { id: actor.userId },
    select: { verificationLevel: true, iprsCheckedAt: true },
  });
  if (!user) return jsonError(404, "User not found");

  if (action === "initiate_level1") {
    // In production: create Didit.me session and return redirect URL
    // For now: mark as session initiated, admin will confirm
    return Response.json({
      data: {
        message: "Identity verification session initiated. Complete the Didit.me flow to confirm Level 1.",
        provider: "didit.me",
        status: "initiated",
      },
    });
  }

  if (action === "check_iprs") {
    if (user.verificationLevel === "UNVERIFIED") {
      return jsonError(400, "Level 1 verification required before IPRS check");
    }
    if (!consentGiven) {
      return jsonError(400, "Explicit consent required before IPRS check");
    }
    // Trigger IPRS check via aggregator (Smile Identity / Identitypass)
    // In production: call aggregator API, update level on success
    return Response.json({
      data: {
        message: "IPRS identity check submitted. You will be notified within 48 hours.",
        status: "pending",
      },
    });
  }

  return jsonError(400, "Invalid action");
});
