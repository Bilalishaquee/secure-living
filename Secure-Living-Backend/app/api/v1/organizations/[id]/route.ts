import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";

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

// Super Admin compliance review for self-service org signups (currently: agencies —
// see auth/register/route.ts). Landlord/independent-manager orgs are created "active"
// and never need this step.
const reviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().optional(),
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

  const nextStatus = parsed.data.decision === "approve" ? "active" : "rejected";
  const updated = await prisma.organization.update({
    where: { id: params.id },
    data: { status: nextStatus },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: parsed.data.decision === "approve" ? "ORGANIZATION_APPROVED" : "ORGANIZATION_REJECTED",
    resourceType: "Organization",
    resourceId: org.id,
    orgId: org.id,
    beforeJson: { status: org.status },
    afterJson: { status: updated.status, note: parsed.data.note ?? null },
  });

  return Response.json({ data: updated });
});
