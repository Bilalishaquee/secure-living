import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";

// The earliest active role assignment for an org is treated as its owner/creator for
// direct notifications (self-registered orgs get a landlord/agency role, not "admin" —
// there is no dedicated ownerUserId column on Organization).
async function resolveOrgOwnerUserId(organizationId: string): Promise<string | null> {
  const assignment = await prisma.userRoleAssignment.findFirst({
    where: { organizationId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });
  return assignment?.userId ?? null;
}

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;

  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: { branches: true, _count: { select: { roleAssignments: true } } },
  });
  if (!org) return jsonError(404, "Organization not found");
  if (!actor.permissions.includes("*") && !actor.orgIds.includes(org.id)) return jsonError(403, "Forbidden");

  return Response.json({ data: { ...org, usersCount: org._count.roleAssignments } });
});

// Ownership model (Update.md "Organization Management" — documented here and surfaced
// in the admin UI): an Organization is owned by whichever landlord/agency self-registers
// it (auth/register/route.ts creates landlord/independent-manager orgs "active"
// instantly — low fraud risk, single-property owners — and agency orgs "pending_review"
// since they take on other people's portfolios). Only a Super Admin can approve/reject a
// pending org, edit any organization's details, or activate/deactivate an org after the
// fact for compliance reasons. The owning org's own members can edit their own org's
// details day-to-day (name/contact info), but cannot self-activate/deactivate.
const reviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().optional(),
  checklist: z
    .object({
      businessRegistrationVerified: z.boolean().default(false),
      contactDetailsConfirmed: z.boolean().default(false),
      kycDocumentsReviewed: z.boolean().default(false),
    })
    .optional(),
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  // Reviewing a pending org is a platform-level compliance action — super admin only.
  if (!actor.permissions.includes("*")) return jsonError(403, "Only a Super Admin can review organizations");

  const org = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!org) return jsonError(404, "Organization not found");

  const parsed = await parseBody(req, reviewSchema);
  if (!parsed.ok) return parsed.response;

  if (org.status !== "pending_review") return jsonError(409, "Organization is not awaiting review");
  if (parsed.data.decision === "reject" && !parsed.data.note?.trim()) {
    return jsonError(400, "A rejection reason is required");
  }

  const nextStatus = parsed.data.decision === "approve" ? "active" : "rejected";
  const updated = await prisma.organization.update({
    where: { id: params.id },
    data: {
      status: nextStatus,
      reviewChecklist: parsed.data.checklist ?? undefined,
      rejectionReason: parsed.data.decision === "reject" ? parsed.data.note!.trim() : null,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: parsed.data.decision === "approve" ? "ORGANIZATION_APPROVED" : "ORGANIZATION_REJECTED",
    resourceType: "Organization",
    resourceId: org.id,
    orgId: org.id,
    beforeJson: { status: org.status },
    afterJson: { status: updated.status, note: parsed.data.note ?? null, checklist: parsed.data.checklist ?? null },
  });

  const ownerUserId = await resolveOrgOwnerUserId(org.id);
  const approved = parsed.data.decision === "approve";
  await notify({
    organizationId: org.id,
    roles: ["super_admin"],
    userIds: ownerUserId ? [ownerUserId] : [],
    excludeUserId: actor.userId,
    type: approved ? "organization.approved" : "organization.rejected",
    severity: approved ? "info" : "warning",
    title: approved ? "Your organization was approved" : "Your organization application needs changes",
    message: approved
      ? `"${org.name}" has been approved and is now active.`
      : `"${org.name}" was not approved: ${parsed.data.note!.trim()}`,
    resourceType: "Organization",
    resourceId: org.id,
    link: "/admin/organizations",
  });

  return Response.json({ data: updated });
});

// Edit organization details. Any member of the org (org:manage) can update their own
// org's contact/tax details; only Super Admin can edit another organization's.
const editSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  kraPin: z.string().optional(),
  bankPayoutAccount: z.string().optional(),
  preferredReportingDate: z.number().int().min(1).max(31).optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const org = await prisma.organization.findUnique({ where: { id: params.id } });
  if (!org) return jsonError(404, "Organization not found");
  const isSuperAdmin = actor.permissions.includes("*");
  const hasOrgManage = actor.permissions.includes("org:manage");
  const isOwnOrg = !!(await prisma.userRoleAssignment.findFirst({
    where: { userId: actor.userId, organizationId: org.id, status: "active" },
    select: { id: true },
  }));
  if (!isSuperAdmin && !(hasOrgManage && actor.orgIds.includes(org.id)) && !isOwnOrg) {
    return jsonError(403, "Forbidden");
  }

  const parsed = await parseBody(req, editSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.organization.update({
    where: { id: params.id },
    data: { ...parsed.data },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "ORGANIZATION_EDITED",
    resourceType: "Organization",
    resourceId: org.id,
    orgId: org.id,
    beforeJson: org,
    afterJson: updated,
  });

  await notify({
    organizationId: org.id,
    roles: ["super_admin"],
    excludeUserId: actor.userId,
    type: "organization.edited",
    severity: "info",
    title: "Organization details updated",
    message: `"${updated.name}" details were updated.`,
    resourceType: "Organization",
    resourceId: org.id,
    link: "/admin/organizations",
  });

  return Response.json({ data: updated });
});
