import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

const assignSchema = z.object({ adminUserId: z.string().min(1) });

// Hand an inquiry off to a specific regional admin (e.g. a Super Admin routing it, or a
// regional admin reassigning within their team). Moves the inquiry to ASSIGNED.
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
  if (!["SUBMITTED", "UNDER_REVIEW", "ASSIGNED"].includes(inquiry.status)) {
    return jsonError(409, "This inquiry can no longer be reassigned");
  }

  const parsed = await parseBody(req, assignSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.managementInquiry.update({
    where: { id: params.id },
    data: { status: "ASSIGNED", assignedAdminId: parsed.data.adminUserId },
  });

  await appendAudit({
    userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_ASSIGNED",
    resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
    afterJson: { assignedAdminId: parsed.data.adminUserId },
  });

  await notify({
    organizationId: inquiry.organizationId,
    branchId: inquiry.branchId,
    roles: ["super_admin"],
    userIds: [parsed.data.adminUserId],
    excludeUserId: actor.userId,
    type: "management_inquiry.assigned",
    severity: "info",
    title: "You've been assigned a management inquiry",
    message: "A management assistance inquiry has been assigned to you for review.",
    resourceType: "ManagementInquiry",
    resourceId: inquiry.id,
    link: "/admin/management-inquiries",
  });

  return Response.json({ data: updated });
});
