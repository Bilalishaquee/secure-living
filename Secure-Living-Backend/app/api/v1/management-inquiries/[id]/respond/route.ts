import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const respondSchema = z.object({
  action: z.enum(["invite", "activate", "decline"]),
});

// Admin either invites the landlord to confirm the takeover ("invite" — landlord must
// accept via /accept), or activates the takeover immediately themselves ("activate"),
// or declines the inquiry.
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
  if (inquiry.status !== "PENDING") return jsonError(409, "Inquiry already responded to");

  if (parsed.data.action === "decline") {
    const updated = await prisma.managementInquiry.update({
      where: { id: params.id },
      data: { status: "DECLINED", respondedBy: actor.userId, respondedAt: new Date() },
    });
    await appendAudit({
      userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_DECLINED",
      resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
    });
    return Response.json({ data: updated });
  }

  if (parsed.data.action === "invite") {
    const updated = await prisma.managementInquiry.update({
      where: { id: params.id },
      data: { status: "INVITED", respondedBy: actor.userId, respondedAt: new Date() },
    });
    await appendAudit({
      userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_INVITED",
      resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
    });
    return Response.json({ data: updated });
  }

  // action === "activate": admin takes over directly, no landlord confirmation step
  const [updated] = await prisma.$transaction([
    prisma.managementInquiry.update({
      where: { id: params.id },
      data: { status: "COMPLETED", respondedBy: actor.userId, respondedAt: new Date() },
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

  return Response.json({ data: updated });
});
