import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

// Super-Admin-only activate/deactivate — distinct from the pending_review approval
// step. Used for compliance action against an already-active organization (e.g. a
// serious complaint, fraud investigation) rather than first-time vetting.
const schema = z.object({
  action: z.enum(["activate", "deactivate"]),
  reason: z.string().optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!actor.permissions.includes("*")) return jsonError(403, "Only a Super Admin can activate or deactivate an organization");

  const org = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!org) return jsonError(404, "Organization not found");

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  if (parsed.data.action === "deactivate" && !parsed.data.reason?.trim()) {
    return jsonError(400, "A reason is required to deactivate an organization");
  }

  const updated = await prisma.organization.update({
    where: { id: params.id },
    data:
      parsed.data.action === "deactivate"
        ? {
            status: "inactive",
            deactivatedAt: new Date(),
            deactivatedBy: actor.userId,
            deactivationReason: parsed.data.reason!.trim(),
          }
        : { status: "active", deactivatedAt: null, deactivatedBy: null, deactivationReason: null },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: parsed.data.action === "deactivate" ? "ORGANIZATION_DEACTIVATED" : "ORGANIZATION_ACTIVATED",
    resourceType: "Organization",
    resourceId: org.id,
    orgId: org.id,
    beforeJson: { status: org.status },
    afterJson: { status: updated.status, reason: parsed.data.reason ?? null },
  });

  const deactivating = parsed.data.action === "deactivate";
  const orgMembers = await prisma.userRoleAssignment.findMany({
    where: { organizationId: org.id, status: "active" },
    select: { userId: true },
  });
  await notify({
    organizationId: org.id,
    roles: ["super_admin"],
    userIds: orgMembers.map((m) => m.userId),
    excludeUserId: actor.userId,
    type: deactivating ? "organization.deactivated" : "organization.activated",
    severity: deactivating ? "critical" : "info",
    title: deactivating ? "Your organization has been deactivated" : "Your organization has been reactivated",
    message: deactivating
      ? `"${org.name}" was deactivated: ${parsed.data.reason!.trim()}`
      : `"${org.name}" is active again.`,
    resourceType: "Organization",
    resourceId: org.id,
    link: "/admin/organizations",
  });

  return Response.json({ data: updated });
});
