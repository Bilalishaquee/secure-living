import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({ message: z.string().max(500).optional() });

// A self-managed landlord raises a Management Assistance inquiry instead of switching
// mode instantly — the branch's admin then invites them or activates the takeover.
export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;

  const property = await prisma.property.findFirst({
    where: { id: params.id, organizationId: { in: actor.orgIds } },
  });
  if (!property) return Response.json({ error: "Property not found" }, { status: 404 });
  if (property.managementMode !== "self_managed") {
    return Response.json({ error: "Only self-managed properties can request management assistance" }, { status: 409 });
  }

  const existing = await prisma.managementInquiry.findFirst({
    where: { propertyId: params.id, status: { in: ["PENDING", "INVITED"] } },
  });
  if (existing) return Response.json({ data: existing }, { status: 200 });

  const inquiry = await prisma.managementInquiry.create({
    data: {
      id: randomUUID(),
      organizationId: property.organizationId,
      branchId: property.branchId,
      propertyId: property.id,
      landlordId: actor.userId,
      message: parsed.data.message ?? null,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "MANAGEMENT_INQUIRY_CREATED",
    resourceType: "ManagementInquiry",
    resourceId: inquiry.id,
    orgId: property.organizationId,
    branchId: property.branchId,
    afterJson: { propertyId: property.id },
  });

  return Response.json({ data: inquiry }, { status: 201 });
});

export const GET = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:create");
  if (denied) return denied;

  const inquiry = await prisma.managementInquiry.findFirst({
    where: { propertyId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: inquiry });
});
