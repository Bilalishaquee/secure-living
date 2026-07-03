import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

// Final archive step — an admin closes out a resolved inquiry (accepted or declined),
// keeping it out of active queues while preserving the full history.
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
  if (!["ACCEPTED", "DECLINED"].includes(inquiry.status)) {
    return jsonError(409, "Only an accepted or declined inquiry can be closed");
  }

  const updated = await prisma.managementInquiry.update({
    where: { id: params.id },
    data: { status: "CLOSED" },
  });

  await appendAudit({
    userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_CLOSED",
    resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
  });

  await notify({
    organizationId: inquiry.organizationId,
    branchId: inquiry.branchId,
    roles: ["super_admin", "admin"],
    excludeUserId: actor.userId,
    type: "management_inquiry.closed",
    severity: "info",
    title: "Management inquiry closed",
    message: "A management assistance inquiry has been closed out.",
    resourceType: "ManagementInquiry",
    resourceId: inquiry.id,
    link: "/admin/management-inquiries",
  });

  return Response.json({ data: updated });
});
