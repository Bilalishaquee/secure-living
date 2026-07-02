import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { hasPermission } from "@/lib/server/authz";
import { appendAudit } from "@/lib/server/audit";
import { statusForAction, canPerformAction } from "@/lib/server/deduction-status";

type Ctx = { params: { id: string } };

const schema = z.object({
  action: z.enum(["accept", "dispute", "finalise"]),
  note: z.string().optional(),
});

// Tenants may accept/dispute deductions raised against their own move-out inspection
// ("Tenant Review & Dispute" — checklist stays Pending Tenant Review until they respond).
// Landlords/staff/admins (vacating:manage) may additionally finalise a deduction.
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.inspectionDeduction.findUnique({
    where: { id: params.id },
    include: { inspection: { include: { vacatingNotice: true } } },
  });
  if (!existing) return jsonError(404, "Deduction not found");

  const isManager = hasPermission(actor, "vacating:manage")
    && (actor.permissions.includes("*") || actor.orgIds.includes(existing.inspection.organizationId));
  const isTenant = hasPermission(actor, "deduction:respond")
    && actor.userId === existing.inspection.vacatingNotice.tenantId;

  if (!canPerformAction(parsed.data.action, isManager, isTenant)) {
    return isManager || isTenant
      ? jsonError(403, "Only a landlord or staff member can finalise a deduction")
      : jsonError(403, "Forbidden");
  }

  const status = statusForAction(parsed.data.action);

  const updated = await prisma.inspectionDeduction.update({
    where: { id: params.id },
    data: {
      status,
      responsibility: status === "disputed" ? "UNKNOWN" : existing.responsibility,
      disputeNote: status === "disputed" ? (parsed.data.note ?? null) : existing.disputeNote,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: `DEDUCTION_${status.toUpperCase()}`,
    resourceType: "InspectionDeduction",
    resourceId: existing.id,
    orgId: existing.inspection.organizationId,
    beforeJson: { status: existing.status },
    afterJson: { status, note: parsed.data.note ?? null },
  });

  return Response.json({ data: updated });
});
