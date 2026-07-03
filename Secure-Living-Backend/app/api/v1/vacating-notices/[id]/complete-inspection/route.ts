import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { DEDUCTION_CATEGORIES, missingEvidence, hasSignedChecklistPair } from "@/lib/server/evidence";
import { appendAudit } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

const deductionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum(DEDUCTION_CATEGORIES).optional(),
  responsibility: z.string().optional(),
  photoUrl: z.string().optional(),
  beforePhotoUrl: z.string().optional(),
  afterPhotoUrl: z.string().optional(),
  repairQuoteUrl: z.string().optional(),
  invoiceUrl: z.string().optional(),
  inspectorNote: z.string().optional(),
  billOrMeterRef: z.string().optional(),
});

const completeSchema = z.object({
  notes: z.string().optional(),
  deductions: z.array(deductionSchema).default([]),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const notice = await prisma.vacatingNotice.findUnique({
    where: { id: params.id },
    include: { inspection: true },
  });
  if (!notice) return jsonError(404, "Vacating notice not found");
  if (!notice.inspection) return jsonError(400, "No inspection scheduled");

  const orgId = actor.orgIds?.[0];
  if (notice.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, completeSchema);
  if (!parsed.ok) return parsed.response;

  const evidenceErrors: { description: string; missing: string[] }[] = [];
  const hasMissingItemDeduction = parsed.data.deductions.some((d) => d.category === "MISSING_ITEM");
  const checklistPairOk = hasMissingItemDeduction ? await hasSignedChecklistPair(prisma, notice.leaseId) : true;
  for (const d of parsed.data.deductions) {
    const missing = missingEvidence(d);
    if (d.category === "MISSING_ITEM" && !checklistPairOk) {
      missing.push("A signed move-in checklist and signed move-out checklist are required for missing-item deductions");
    }
    if (missing.length > 0) evidenceErrors.push({ description: d.description, missing });
  }
  if (evidenceErrors.length > 0) {
    return Response.json(
      { error: "Missing required evidence for one or more deductions", details: evidenceErrors },
      { status: 400 },
    );
  }

  const inspection = await prisma.moveOutInspection.update({
    where: { id: notice.inspection.id },
    data: {
      status: "COMPLETED",
      inspectedBy: actor.userId,
      notes: parsed.data.notes,
      deductions: {
        create: parsed.data.deductions.map((d) => ({
          description: d.description,
          amount: d.amount,
          category: d.category,
          responsibility: d.responsibility,
          photoUrl: d.photoUrl,
          beforePhotoUrl: d.beforePhotoUrl,
          afterPhotoUrl: d.afterPhotoUrl,
          repairQuoteUrl: d.repairQuoteUrl,
          invoiceUrl: d.invoiceUrl,
          inspectorNote: d.inspectorNote,
          billOrMeterRef: d.billOrMeterRef,
        })),
      },
    },
    include: { deductions: true },
  });

  await prisma.vacatingNotice.update({
    where: { id: params.id },
    data: { status: "INSPECTION_DONE" },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "INSPECTION_COMPLETED",
    resourceType: "MoveOutInspection",
    resourceId: inspection.id,
    orgId: notice.organizationId,
    afterJson: { deductionCount: inspection.deductions.length, totalAmount: inspection.deductions.reduce((s, d) => s + d.amount, 0) },
  });

  if (inspection.deductions.length > 0) {
    const total = inspection.deductions.reduce((s, d) => s + d.amount, 0);
    await notify({
      roles: [],
      userIds: [notice.tenantId],
      excludeUserId: actor.userId,
      type: "deduction.proposed",
      severity: "warning",
      title: "Deposit deductions proposed for your move-out",
      message: `${inspection.deductions.length} deduction${inspection.deductions.length !== 1 ? "s" : ""} totalling KES ${total.toLocaleString()} — review and respond.`,
      resourceType: "MoveOutInspection",
      resourceId: inspection.id,
      link: "/tenant/lease",
    });
  }

  return Response.json({ data: inspection });
});
