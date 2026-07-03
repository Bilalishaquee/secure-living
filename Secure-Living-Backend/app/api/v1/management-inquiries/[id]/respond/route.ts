import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

const respondSchema = z.object({
  action: z.enum(["invite", "activate", "decline"]),
  reason: z.string().max(1000).optional(),
});

// Status machine: SUBMITTED -> UNDER_REVIEW -> ASSIGNED -> INVITATION_SENT -> ACCEPTED|DECLINED -> CLOSED
// (UNDER_REVIEW/ASSIGNED come from /claim and /assign). An admin can invite or activate
// from any non-terminal, non-invited state, or decline it outright.
const RESPONDABLE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED"];

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, respondSchema);
  if (!parsed.ok) return parsed.response;

  const inquiry = await prisma.managementInquiry.findUnique({ where: { id: params.id } });
  if (!inquiry) return jsonError(404, "Inquiry not found");
  if (!actor.permissions.includes("*") && !actor.branchIds.includes(inquiry.branchId)) {
    return jsonError(403, "Forbidden — outside your assigned branch");
  }
  if (!RESPONDABLE_STATUSES.includes(inquiry.status)) {
    return jsonError(409, "Inquiry already responded to");
  }

  if (parsed.data.action === "decline") {
    if (!parsed.data.reason?.trim()) return jsonError(400, "A reason is required to decline an inquiry");
    const updated = await prisma.managementInquiry.update({
      where: { id: params.id },
      data: { status: "DECLINED", respondedBy: actor.userId, respondedAt: new Date(), declineReason: parsed.data.reason.trim() },
    });
    await appendAudit({
      userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_DECLINED",
      resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
      afterJson: { reason: parsed.data.reason.trim() },
    });
    await notify({
      organizationId: inquiry.organizationId,
      branchId: inquiry.branchId,
      roles: [],
      userIds: [inquiry.landlordId],
      type: "management_inquiry.declined",
      severity: "warning",
      title: "Management assistance request declined",
      message: `Your request was declined: ${parsed.data.reason.trim()}`,
      resourceType: "ManagementInquiry",
      resourceId: inquiry.id,
      link: `/properties/${inquiry.propertyId}`,
    });
    return Response.json({ data: updated });
  }

  if (parsed.data.action === "invite") {
    const updated = await prisma.managementInquiry.update({
      where: { id: params.id },
      data: { status: "INVITATION_SENT", respondedBy: actor.userId, respondedAt: new Date() },
    });
    await appendAudit({
      userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_INVITED",
      resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
    });
    await notify({
      organizationId: inquiry.organizationId,
      branchId: inquiry.branchId,
      roles: [],
      userIds: [inquiry.landlordId],
      type: "management_inquiry.invitation_sent",
      severity: "info",
      title: "Management assistance invitation",
      message: "An admin has invited you to hand over full-service management for your property. Accept or decline from the property page.",
      resourceType: "ManagementInquiry",
      resourceId: inquiry.id,
      link: `/properties/${inquiry.propertyId}`,
    });
    return Response.json({ data: updated });
  }

  // action === "activate": admin takes over directly, no landlord confirmation step
  const [updated] = await prisma.$transaction([
    prisma.managementInquiry.update({
      where: { id: params.id },
      data: { status: "ACCEPTED", respondedBy: actor.userId, respondedAt: new Date() },
    }),
    prisma.property.update({
      where: { id: inquiry.propertyId },
      data: { managementMode: "full_service" },
    }),
  ]);

  await appendAudit({
    userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_ACTIVATED",
    resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
    afterJson: { propertyId: inquiry.propertyId, managementMode: "full_service" },
  });

  await notify({
    organizationId: inquiry.organizationId,
    branchId: inquiry.branchId,
    roles: [],
    userIds: [inquiry.landlordId],
    type: "management_inquiry.activated",
    severity: "info",
    title: "Management takeover activated",
    message: "Your property has been switched to full-service management by an admin.",
    resourceType: "ManagementInquiry",
    resourceId: inquiry.id,
    link: `/properties/${inquiry.propertyId}`,
  });

  return Response.json({ data: updated });
});
