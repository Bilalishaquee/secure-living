import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const createSchema = z.object({
  referrerUserId: z.string().optional(),
  referrerRole: z.string().optional(),
  organizationId: z.string().optional(),
  rewardType: z.enum(["free_subscription_period", "account_credit", "listing_credit", "management_fee_discount", "promotional_voucher"]).default("free_subscription_period"),
  rewardValue: z.string().default("1_month"),
  isActive: z.boolean().default(true),
});

function canManageCommercial(role: string, permissions: string[]) {
  return role === "super_admin" || role === "admin" || permissions.includes("*") || permissions.includes("org:manage");
}

function codeFor(actor: { userId: string; role: string }) {
  return `${actor.role.slice(0, 3)}-${actor.userId.slice(0, 6)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "true";
  const where = mine || !canManageCommercial(actor.role, actor.permissions)
    ? { referrerUserId: actor.userId }
    : actor.role === "super_admin" || actor.permissions.includes("*")
      ? {}
      : { OR: [{ referrerUserId: actor.userId }, { organizationId: { in: actor.orgIds } }] };
  const rows = await prisma.referralCode.findMany({
    where,
    include: { referrals: { orderBy: { createdAt: "desc" }, take: 5 } },
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

  const referrerUserId = body.referrerUserId ?? actor.userId;
  if (referrerUserId !== actor.userId && !canManageCommercial(actor.role, actor.permissions)) return jsonError(403, "Forbidden");
  if (body.organizationId && actor.role !== "super_admin" && !actor.permissions.includes("*") && !actor.orgIds.includes(body.organizationId)) {
    return jsonError(403, "Out of scope");
  }

  const row = await prisma.referralCode.create({
    data: {
      code: codeFor({ userId: referrerUserId, role: body.referrerRole ?? actor.role }),
      referrerUserId,
      referrerRole: body.referrerRole ?? actor.role,
      organizationId: body.organizationId ?? actor.orgIds[0],
      rewardType: body.rewardType,
      rewardValue: body.rewardValue,
      isActive: body.isActive,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "commercial.referral_code.created",
    resourceType: "referral_code",
    resourceId: row.id,
    orgId: row.organizationId,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
});
