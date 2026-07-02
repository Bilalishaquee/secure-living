import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Landlord accepts an admin's invitation, completing the takeover.
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:create");
  if (denied) return denied;

  const inquiry = await prisma.managementInquiry.findUnique({ where: { id: params.id } });
  if (!inquiry) return jsonError(404, "Inquiry not found");
  if (inquiry.landlordId !== actor.userId) return jsonError(403, "Forbidden");
  if (inquiry.status !== "INVITED") return jsonError(409, "No pending invitation to accept");

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
    userId: actor.userId, role: actor.role, action: "MANAGEMENT_INQUIRY_ACCEPTED",
    resourceType: "ManagementInquiry", resourceId: inquiry.id, orgId: inquiry.organizationId, branchId: inquiry.branchId,
    afterJson: { propertyId: inquiry.propertyId, managementMode: "full_service" },
  });

  return Response.json({ data: updated });
});
