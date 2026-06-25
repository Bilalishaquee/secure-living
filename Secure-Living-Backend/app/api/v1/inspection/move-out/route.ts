import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

const deductionSchema = z.object({
  itemName: z.string().min(1),
  amount: z.number().nonnegative(),
  category: z.string().default("damage"),
  responsibility: z.string().default("TENANT"),
  photoUrl: z.string().optional(),
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
          status: "proposed",
        })),
      },
    },
    include: { deductions: true },
  });

  await prisma.vacatingNotice.update({ where: { id: notice.id }, data: { status: "INSPECTION_DONE" } });
  return Response.json({ data: inspection }, { status: 201 });
});
