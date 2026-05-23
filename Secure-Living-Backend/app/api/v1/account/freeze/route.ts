import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const applySchema = z.object({
  userId: z.string().min(1),
  freezeType: z.enum(["SOFT", "HARD"]),
  reason: z.string().min(1),
  requiredAction: z.string().optional(),
});

const liftSchema = z.object({
  freezeId: z.string().min(1),
  liftReason: z.string().min(1),
});

// GET — list freezes (admin: by userId; user: own freezes)
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? actor.userId;
  const isAdmin = actor.permissions.includes("*") || actor.permissions.includes("admin:freeze");

  if (userId !== actor.userId && !isAdmin) {
    return jsonError(403, "Forbidden");
  }

  const freezes = await prisma.accountFreeze.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { appliedAt: "desc" },
  });

  return Response.json({ data: freezes });
});

// POST — admin applies a freeze
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "admin:freeze");
  if (denied) return denied;

  const parsed = await parseBody(req, applySchema);
  if (!parsed.ok) return parsed.response;
  const { userId, freezeType, reason, requiredAction } = parsed.data;

  const user = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "User not found");

  const freeze = await prisma.accountFreeze.create({
    data: {
      userId,
      freezeType: freezeType as any,
      reason,
      requiredAction,
      appliedBy: actor.userId,
      notifiedAt: new Date(),
    },
  });

  // Update user status for hard freeze
  if (freezeType === "HARD") {
    await prisma.appUser.update({
      where: { id: userId },
      data: { status: "suspended" },
    });
  }

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: actor.userId,
      role: actor.role ?? "admin",
      action: `account_freeze_${freezeType.toLowerCase()}`,
      resourceType: "AppUser",
      resourceId: userId,
      afterJson: JSON.stringify({ freezeType, reason, requiredAction }),
    },
  });

  return Response.json({ data: freeze }, { status: 201 });
});

// PATCH — admin lifts a freeze
export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "admin:freeze");
  if (denied) return denied;

  const parsed = await parseBody(req, liftSchema);
  if (!parsed.ok) return parsed.response;
  const { freezeId, liftReason } = parsed.data;

  const freeze = await prisma.accountFreeze.findUnique({ where: { id: freezeId } });
  if (!freeze) return jsonError(404, "Freeze not found");
  if (freeze.status !== "ACTIVE") return jsonError(400, "Freeze is not active");

  await prisma.accountFreeze.update({
    where: { id: freezeId },
    data: {
      status: "LIFTED",
      liftedAt: new Date(),
      liftedBy: actor.userId,
      liftReason,
    },
  });

  // Check if any other active hard freezes remain
  const otherHardFreezes = await prisma.accountFreeze.count({
    where: {
      userId: freeze.userId,
      freezeType: "HARD",
      status: "ACTIVE",
      id: { not: freezeId },
    },
  });

  if (otherHardFreezes === 0) {
    await prisma.appUser.update({
      where: { id: freeze.userId },
      data: { status: "active" },
    });
  }

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: actor.userId,
      role: actor.role ?? "admin",
      action: "account_freeze_lifted",
      resourceType: "AccountFreeze",
      resourceId: freezeId,
      afterJson: JSON.stringify({ liftReason }),
    },
  });

  return Response.json({ data: { message: "Freeze lifted" } });
});
