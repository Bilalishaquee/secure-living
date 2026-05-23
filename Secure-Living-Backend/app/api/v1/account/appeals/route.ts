import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const submitSchema = z.object({
  freezeId: z.string().min(1),
  reason: z.string().min(10, "Please provide a detailed reason"),
  evidenceUrls: z.array(z.string().url()).optional().default([]),
  isSecondAppeal: z.boolean().optional().default(false),
});

const reviewSchema = z.object({
  appealId: z.string().min(1),
  decision: z.enum(["UPHELD", "OVERTURNED"]),
  decisionReason: z.string().min(1),
});

// POST — user submits an appeal
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, submitSchema);
  if (!parsed.ok) return parsed.response;
  const { freezeId, reason, evidenceUrls, isSecondAppeal } = parsed.data;

  const freeze = await prisma.accountFreeze.findUnique({
    where: { id: freezeId },
    include: { appeals: true },
  });
  if (!freeze) return jsonError(404, "Freeze not found");
  if (freeze.userId !== actor.userId) return jsonError(403, "Forbidden");
  if (freeze.status !== "ACTIVE") return jsonError(400, "This freeze is no longer active");

  // 14-day appeal window
  const appealDeadline = new Date(freeze.appliedAt);
  appealDeadline.setDate(appealDeadline.getDate() + 14);
  if (new Date() > appealDeadline) {
    return jsonError(400, "The 14-day appeal window has expired");
  }

  // Max 2 appeals (1 second appeal only if new evidence)
  const existingAppeals = freeze.appeals.filter((a) => a.status !== "OVERTURNED");
  if (existingAppeals.length >= 2) {
    return jsonError(400, "Maximum appeals reached. No further appeals are permitted.");
  }
  if (existingAppeals.length >= 1 && !isSecondAppeal) {
    return jsonError(400, "A first appeal is already submitted. Mark isSecondAppeal=true to submit a second appeal with new evidence.");
  }

  const pendingAppeal = freeze.appeals.find((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW");
  if (pendingAppeal) return jsonError(400, "An appeal is already under review");

  const appeal = await prisma.freezeAppeal.create({
    data: {
      freezeId,
      userId: actor.userId,
      reason,
      evidenceUrls,
      isSecondAppeal,
    },
  });

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: actor.userId,
      role: actor.role ?? "user",
      action: "freeze_appeal_submitted",
      resourceType: "AccountFreeze",
      resourceId: freezeId,
      afterJson: JSON.stringify({ appealId: appeal.id, isSecondAppeal }),
    },
  });

  return Response.json({ data: appeal }, { status: 201 });
});

// PATCH — admin reviews an appeal (SLA: 5 business days)
export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "admin:freeze");
  if (denied) return denied;

  const parsed = await parseBody(req, reviewSchema);
  if (!parsed.ok) return parsed.response;
  const { appealId, decision, decisionReason } = parsed.data;

  const appeal = await prisma.freezeAppeal.findUnique({
    where: { id: appealId },
    include: { freeze: true },
  });
  if (!appeal) return jsonError(404, "Appeal not found");

  await prisma.freezeAppeal.update({
    where: { id: appealId },
    data: {
      status: decision as any,
      reviewedAt: new Date(),
      reviewedBy: actor.userId,
      decisionReason,
    },
  });

  // If overturned, lift the freeze
  if (decision === "OVERTURNED") {
    await prisma.accountFreeze.update({
      where: { id: appeal.freezeId },
      data: {
        status: "LIFTED",
        liftedAt: new Date(),
        liftedBy: actor.userId,
        liftReason: `Appeal overturned: ${decisionReason}`,
      },
    });
    await prisma.appUser.update({
      where: { id: appeal.freeze.userId },
      data: { status: "active" },
    });
  }

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: actor.userId,
      role: actor.role ?? "admin",
      action: `appeal_${decision.toLowerCase()}`,
      resourceType: "FreezeAppeal",
      resourceId: appealId,
      afterJson: JSON.stringify({ decision, decisionReason }),
    },
  });

  return Response.json({ data: { appealId, decision, decisionReason } });
});

// GET — list appeals for admin queue or user's own
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const isAdmin = actor.permissions.includes("*") || actor.permissions.includes("admin:freeze");
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const appeals = await prisma.freezeAppeal.findMany({
    where: {
      ...(isAdmin ? {} : { userId: actor.userId }),
      ...(status ? { status: status as any } : {}),
    },
    include: { freeze: { select: { freezeType: true, reason: true, appliedAt: true } } },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return Response.json({ data: appeals });
});
