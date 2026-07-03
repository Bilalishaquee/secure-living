import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

// A regional admin claims a freshly submitted inquiry — moves it from SUBMITTED into
// UNDER_REVIEW and self-assigns it, so it stops sitting in the unclaimed queue.
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
  if (inquiry.status !== "SUBMITTED") return jsonError(409, "Only a newly submitted inquiry can be claimed");

  const updated = await prisma.managementInquiry.update({
    where: { id: params.id },
    data: { status: "UNDER_REVIEW", assignedAdminId: actor.userId },
  });

  await appendAudit({
    userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_CLAIMED",
    resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
  });

  await notify({
    organizationId: inquiry.organizationId,
    branchId: inquiry.branchId,
    roles: ["super_admin"],
    excludeUserId: actor.userId,
    type: "management_inquiry.claimed",
    severity: "info",
    title: "Management inquiry claimed",
    message: `An admin has claimed a management assistance inquiry for review.`,
    resourceType: "ManagementInquiry",
    resourceId: inquiry.id,
    link: "/admin/management-inquiries",
  });

  return Response.json({ data: updated });
});
