import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { missingEvidence, hasSignedChecklistPair } from "@/lib/server/evidence";
import { appendAudit } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";

const deductionSchema = z.object({
  itemName: z.string().min(1),
  amount: z.number().nonnegative(),
  category: z.string().default("damage"),
  responsibility: z.string().default("TENANT"),
  photoUrl: z.string().optional(),
  beforePhotoUrl: z.string().optional(),
  afterPhotoUrl: z.string().optional(),
  repairQuoteUrl: z.string().optional(),
  invoiceUrl: z.string().optional(),
  inspectorNote: z.string().optional(),
  billOrMeterRef: z.string().optional(),
});

const schema = z.object({
  leaseId: z.string().min(1),
  inspectionData: z.unknown(),
  deductions: z.array(deductionSchema).default([]),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const lease = await prisma.lease.findUnique({ where: { id: parsed.data.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const evidenceErrors: { itemName: string; missing: string[] }[] = [];
  const hasMissingItemDeduction = parsed.data.deductions.some((d) => d.category.toUpperCase() === "MISSING_ITEM");
  const checklistPairOk = hasMissingItemDeduction ? await hasSignedChecklistPair(prisma, lease.id) : true;
  for (const d of parsed.data.deductions) {
    const missing = missingEvidence({ ...d, category: d.category.toUpperCase() });
    if (d.category.toUpperCase() === "MISSING_ITEM" && !checklistPairOk) {
      missing.push("A signed move-in checklist and signed move-out checklist are required for missing-item deductions");
    }
    if (missing.length > 0) evidenceErrors.push({ itemName: d.itemName, missing });
  }
  if (evidenceErrors.length > 0) {
    return Response.json(
      { error: "Missing required evidence for one or more deductions", details: evidenceErrors },
      { status: 400 },
    );
  }

  let notice = await prisma.vacatingNotice.findUnique({ where: { leaseId: lease.id } });
  if (!notice) {
    const moveOut = new Date();
    moveOut.setDate(moveOut.getDate() + 30);
    notice = await prisma.vacatingNotice.create({
      data: {
        leaseId: lease.id,
        unitId: lease.unitId,
        tenantId: lease.tenantUserId,
        organizationId: lease.organizationId,
        intendedMoveOut: moveOut,
        enforcedMoveOut: moveOut,
        tenantNote: "Move-out inspection initiated by inspector workflow.",
      },
    });
  }

  const inspection = await prisma.moveOutInspection.upsert({
    where: { vacatingNoticeId: notice.id },
    update: {
      status: "COMPLETED",
      inspectedBy: actor.userId,
      notes: JSON.stringify(parsed.data.inspectionData),
      deductions: {
        deleteMany: {},
        create: parsed.data.deductions.map((d) => ({
          description: d.itemName,
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
          status: "proposed",
        })),
      },
    },
    create: {
      vacatingNoticeId: notice.id,
      organizationId: lease.organizationId,
      scheduledDate: new Date(),
      status: "COMPLETED",
      inspectedBy: actor.userId,
      notes: JSON.stringify(parsed.data.inspectionData),
      deductions: {
        create: parsed.data.deductions.map((d) => ({
          description: d.itemName,
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
          status: "proposed",
        })),
      },
    },
    include: { deductions: true },
  });

  await prisma.vacatingNotice.update({ where: { id: notice.id }, data: { status: "INSPECTION_DONE" } });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "INSPECTION_COMPLETED",
    resourceType: "MoveOutInspection",
    resourceId: inspection.id,
    orgId: lease.organizationId,
    afterJson: { deductionCount: inspection.deductions.length },
  });

  if (inspection.deductions.length > 0) {
    const total = inspection.deductions.reduce((s, d) => s + d.amount, 0);
    await notify({
      roles: [],
      userIds: [lease.tenantUserId],
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

  return Response.json({ data: inspection }, { status: 201 });
});
