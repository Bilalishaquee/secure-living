import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

// Re-application path after a rejected agency approval (Update.md "Agency Approval
// Workflow — re-application workflow"): a member of the rejected org can resubmit for
// review rather than being permanently stuck.
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const org = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!org) return jsonError(404, "Organization not found");
  const isOwnOrg = !!(await prisma.userRoleAssignment.findFirst({
    where: { userId: actor.userId, organizationId: org.id, status: "active" },
    select: { id: true },
  }));
  if (!actor.permissions.includes("*") && !actor.orgIds.includes(org.id) && !isOwnOrg) return jsonError(403, "Forbidden");
  if (org.status !== "rejected") return jsonError(409, "Only a rejected organization can be resubmitted");

  const updated = await prisma.organization.update({
    where: { id: params.id },
    data: {
      status: "pending_review",
      rejectionReason: null,
      reapplicationCount: { increment: 1 },
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "ORGANIZATION_REAPPLIED",
    resourceType: "Organization",
    resourceId: org.id,
    orgId: org.id,
    afterJson: { reapplicationCount: updated.reapplicationCount },
  });

  await notify({
    organizationId: org.id,
    roles: ["super_admin"],
    excludeUserId: actor.userId,
    type: "organization.reapplied",
    severity: "info",
    title: "Organization resubmitted for review",
    message: `"${org.name}" was resubmitted for approval (attempt #${updated.reapplicationCount}).`,
    resourceType: "Organization",
    resourceId: org.id,
    link: "/admin/organizations",
  });

  return Response.json({ data: updated });
});
