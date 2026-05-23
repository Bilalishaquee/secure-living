import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const overrideSchema = z.object({
  userId: z.string().min(1),
  level: z.enum(["UNVERIFIED", "IDENTITY_VERIFIED", "COMPLIANCE_VERIFIED", "TRUSTED_PERSONNEL", "ENTERPRISE_VERIFIED"]),
  reason: z.string().min(1),
});

// POST /api/v1/admin/verification — admin manual verification level override
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "admin:kyc");
  if (denied) return denied;

  const parsed = await parseBody(req, overrideSchema);
  if (!parsed.ok) return parsed.response;
  const { userId, level, reason } = parsed.data;

  const user = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "User not found");

  await prisma.appUser.update({
    where: { id: userId },
    data: {
      verificationLevel: level as any,
      verificationLevelSetAt: new Date(),
    },
  });

  // Immutable audit log
  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: actor.userId,
      role: actor.role ?? "admin",
      action: "admin_verification_override",
      resourceType: "AppUser",
      resourceId: userId,
      beforeJson: JSON.stringify({ verificationLevel: user.verificationLevel }),
      afterJson: JSON.stringify({ verificationLevel: level, reason }),
    },
  });

  return Response.json({ data: { userId, level, reason } });
});

// POST /api/v1/admin/verification/trusted-personnel-review — approve or deny Level 3 application
const reviewSchema = z.object({
  userId: z.string().min(1),
  decision: z.enum(["APPROVED", "DENIED"]),
  reason: z.string().min(1),
});

export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "admin:kyc");
  if (denied) return denied;

  const parsed = await parseBody(req, reviewSchema);
  if (!parsed.ok) return parsed.response;
  const { userId, decision, reason } = parsed.data;

  const user = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "User not found");
  if (user.trustedPersonnelStatus !== "PENDING") {
    return jsonError(400, "No pending application for this user");
  }

  await prisma.appUser.update({
    where: { id: userId },
    data: {
      trustedPersonnelStatus: decision,
      verificationLevel: decision === "APPROVED" ? "TRUSTED_PERSONNEL" : user.verificationLevel,
      verificationLevelSetAt: decision === "APPROVED" ? new Date() : user.verificationLevelSetAt,
      trustedPersonnelReviewedAt: new Date(),
      trustedPersonnelReviewedBy: actor.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: actor.userId,
      role: actor.role ?? "admin",
      action: `trusted_personnel_${decision.toLowerCase()}`,
      resourceType: "AppUser",
      resourceId: userId,
      afterJson: JSON.stringify({ decision, reason }),
    },
  });

  return Response.json({ data: { userId, decision, reason } });
});
