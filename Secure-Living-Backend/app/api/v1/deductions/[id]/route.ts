import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { DEDUCTION_CATEGORIES } from "@/lib/server/evidence";
import { appendAudit } from "@/lib/server/audit";

type Ctx = { params: { id: string } };

// Landlord/staff supplement or correct evidence on a deduction — typically used after a
// tenant disputes a charge, to add a repair quote, invoice, or additional photos before
// re-submitting for tenant review.
const updateSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.enum(DEDUCTION_CATEGORIES).optional(),
  photoUrl: z.string().optional(),
  beforePhotoUrl: z.string().optional(),
  afterPhotoUrl: z.string().optional(),
  repairQuoteUrl: z.string().optional(),
  invoiceUrl: z.string().optional(),
  inspectorNote: z.string().optional(),
  billOrMeterRef: z.string().optional(),
  resubmit: z.boolean().default(true), // reset status back to "proposed" for tenant re-review
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const deduction = await prisma.inspectionDeduction.findUnique({
    where: { id: params.id },
    include: { inspection: { include: { vacatingNotice: true } } },
  });
  if (!deduction) return jsonError(404, "Deduction not found");

  const isTenant = actor.userId === deduction.inspection.vacatingNotice.tenantId;
  const inOrg = actor.permissions.includes("*") || actor.orgIds.includes(deduction.inspection.organizationId);
  if (!isTenant && !inOrg) return jsonError(403, "Forbidden");

  return Response.json({ data: deduction });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const existing = await prisma.inspectionDeduction.findUnique({
    where: { id: params.id },
    include: { inspection: true },
  });
  if (!existing) return jsonError(404, "Deduction not found");
  if (!actor.permissions.includes("*") && !actor.orgIds.includes(existing.inspection.organizationId)) {
    return jsonError(403, "Forbidden");
  }

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const updated = await prisma.inspectionDeduction.update({
    where: { id: params.id },
    data: {
      ...(b.description !== undefined && { description: b.description }),
      ...(b.amount !== undefined && { amount: b.amount }),
      ...(b.category !== undefined && { category: b.category }),
      ...(b.photoUrl !== undefined && { photoUrl: b.photoUrl }),
      ...(b.beforePhotoUrl !== undefined && { beforePhotoUrl: b.beforePhotoUrl }),
      ...(b.afterPhotoUrl !== undefined && { afterPhotoUrl: b.afterPhotoUrl }),
      ...(b.repairQuoteUrl !== undefined && { repairQuoteUrl: b.repairQuoteUrl }),
      ...(b.invoiceUrl !== undefined && { invoiceUrl: b.invoiceUrl }),
      ...(b.inspectorNote !== undefined && { inspectorNote: b.inspectorNote }),
      ...(b.billOrMeterRef !== undefined && { billOrMeterRef: b.billOrMeterRef }),
      ...(b.resubmit && { status: "proposed", disputeNote: null }),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "DEDUCTION_EVIDENCE_UPDATED",
    resourceType: "InspectionDeduction",
    resourceId: existing.id,
    orgId: existing.inspection.organizationId,
    beforeJson: { status: existing.status },
    afterJson: { status: updated.status },
  });

  return Response.json({ data: updated });
});
