import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const createSchema = z.object({
  referralCode: z.string().min(2),
  referredEmail: z.string().email().optional(),
  referredName: z.string().optional(),
  referredUserId: z.string().optional(),
  status: z.enum(["invited", "registered", "verified", "qualified", "rewarded"]).default("invited"),
  qualificationNote: z.string().optional(),
});

function canManageCommercial(role: string, permissions: string[]) {
  return role === "super_admin" || role === "admin" || permissions.includes("*") || permissions.includes("org:manage");
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const where = canManageCommercial(actor.role, actor.permissions)
    ? {
        ...(status ? { status } : {}),
        ...(actor.role === "super_admin" || actor.permissions.includes("*") ? {} : {
          referralCode: { organizationId: { in: actor.orgIds } },
        }),
      }
    : {
        ...(status ? { status } : {}),
        referralCode: { referrerUserId: actor.userId },
      };

  const rows = await prisma.referral.findMany({
    where,
    include: { referralCode: true, activity: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const code = await prisma.referralCode.findUnique({ where: { code: body.referralCode } });
  if (!code || !code.isActive) return jsonError(404, "Referral code not found or inactive");

  const canUseCode = code.referrerUserId === actor.userId || canManageCommercial(actor.role, actor.permissions);
  if (!canUseCode && code.organizationId && !actor.orgIds.includes(code.organizationId)) return jsonError(403, "Out of scope");

  const row = await prisma.$transaction(async (tx) => {
    const referral = await tx.referral.create({
      data: {
        referralCodeId: code.id,
        referredEmail: body.referredEmail,
        referredName: body.referredName,
        referredUserId: body.referredUserId,
        status: body.status,
        rewardType: code.rewardType,
        rewardValue: code.rewardValue,
        qualificationNote: body.qualificationNote,
        rewardEligible: ["qualified", "rewarded"].includes(body.status),
      },
    });
    await tx.referralActivity.create({
      data: {
        referralId: referral.id,
        actorUserId: actor.userId,
        eventType: body.status,
        note: body.qualificationNote ?? "Referral created",
      },
    });
    return referral;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "commercial.referral.created",
    resourceType: "referral",
    resourceId: row.id,
    orgId: code.organizationId,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
});
