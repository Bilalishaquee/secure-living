import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["invited", "registered", "verified", "qualified", "rewarded"]).optional(),
  qualificationNote: z.string().optional(),
  rewardEligible: z.boolean().optional(),
  approveReward: z.boolean().optional(),
  issueReward: z.boolean().optional(),
  note: z.string().optional(),
});

function canManageCommercial(role: string, permissions: string[]) {
  return role === "super_admin" || role === "admin" || permissions.includes("*") || permissions.includes("org:manage");
}

export const PUT = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const existing = await prisma.referral.findUnique({ where: { id: params.id }, include: { referralCode: true } });
  if (!existing) return jsonError(404, "Referral not found");
  const owner = existing.referralCode.referrerUserId === actor.userId;
  if (!owner && !canManageCommercial(actor.role, actor.permissions)) return jsonError(403, "Forbidden");
  if (existing.referralCode.organizationId && actor.role !== "super_admin" && !actor.permissions.includes("*") && !actor.orgIds.includes(existing.referralCode.organizationId)) {
    return jsonError(403, "Out of scope");
  }

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const now = new Date();

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.referral.update({
      where: { id: params.id },
      data: {
        status: body.status,
        qualificationNote: body.qualificationNote,
        rewardEligible: body.rewardEligible ?? (body.status === "qualified" ? true : undefined),
        rewardApprovedAt: body.approveReward ? now : undefined,
        rewardApprovedBy: body.approveReward ? actor.userId : undefined,
        rewardIssuedAt: body.issueReward ? now : undefined,
      },
      include: { referralCode: true, activity: { orderBy: { createdAt: "desc" } } },
    });
    await tx.referralActivity.create({
      data: {
        referralId: params.id,
        actorUserId: actor.userId,
        eventType: body.issueReward ? "reward_issued" : body.approveReward ? "reward_approved" : body.status ?? "updated",
        note: body.note ?? body.qualificationNote,
      },
    });
    return updated;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "commercial.referral.updated",
    resourceType: "referral",
    resourceId: row.id,
    orgId: row.referralCode.organizationId,
    beforeJson: existing,
    afterJson: row,
  });
  return Response.json({ data: row });
});
