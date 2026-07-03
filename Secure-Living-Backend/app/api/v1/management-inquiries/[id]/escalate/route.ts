import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

const escalateSchema = z.object({ reason: z.string().min(1).max(1000) });

// Regional admin -> Super Admin escalation path. Doesn't change the primary status (the
// inquiry stays wherever it was in the review flow) — it flags the inquiry so it surfaces
// in the Super Admin's queue for direct attention.
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;

  const inquiry = await prisma.managementInquiry.findUnique({ where: { id: params.id } });
  if (!inquiry) return jsonError(404, "Inquiry not found");
  if (!actor.permissions.includes("*") && !actor.branchIds.includes(inquiry.branchId)) {
    return jsonError(403, "Forbidden — outside your assigned branch");
  }
  if (["DECLINED", "ACCEPTED", "CLOSED"].includes(inquiry.status)) {
    return jsonError(409, "This inquiry is already resolved and cannot be escalated");
  }

  const parsed = await parseBody(req, escalateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.managementInquiry.update({
    where: { id: params.id },
    data: { escalatedToSuperAdmin: true, escalatedAt: new Date(), escalationReason: parsed.data.reason.trim() },
  });

  await appendAudit({
    userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_ESCALATED",
    resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
    afterJson: { reason: parsed.data.reason.trim() },
  });

  await notify({
    organizationId: inquiry.organizationId,
    branchId: inquiry.branchId,
    roles: ["super_admin"],
    excludeUserId: actor.userId,
    type: "management_inquiry.escalated",
    severity: "warning",
    title: "Management inquiry escalated to Super Admin",
    message: `An admin escalated a management inquiry: ${parsed.data.reason.trim()}`,
    resourceType: "ManagementInquiry",
    resourceId: inquiry.id,
    link: "/admin/management-inquiries",
  });

  return Response.json({ data: updated });
});
