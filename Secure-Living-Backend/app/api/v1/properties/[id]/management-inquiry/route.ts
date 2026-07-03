import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

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
    where: { propertyId: params.id, status: { in: ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "INVITATION_SENT"] } },
  });
  if (existing) return Response.json({ data: existing }, { status: 200 });

  // Same region-derivation convention as ComplianceNumber — routes the inquiry to
  // whichever admin covers that geographic area.
  const regionSource = property.county || property.city || "";
  const regionLetters = regionSource.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const region = regionLetters.length >= 3 ? regionLetters.slice(0, 3) : "GEN";

  const inquiry = await prisma.managementInquiry.create({
    data: {
      id: randomUUID(),
      organizationId: property.organizationId,
      branchId: property.branchId,
      propertyId: property.id,
      landlordId: actor.userId,
      region,
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

  await notify({
    organizationId: property.organizationId,
    branchId: property.branchId,
    roles: ["super_admin", "admin"],
    excludeUserId: actor.userId,
    type: "management_inquiry.submitted",
    severity: "info",
    title: "New management assistance request",
    message: `${property.name} has requested management assistance and needs review.`,
    resourceType: "ManagementInquiry",
    resourceId: inquiry.id,
    link: "/admin/management-inquiries",
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
