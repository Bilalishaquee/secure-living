import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const deductionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  photoUrl: z.string().optional(),
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
          photoUrl: d.photoUrl,
        })),
      },
    },
    include: { deductions: true },
  });

  await prisma.vacatingNotice.update({
    where: { id: params.id },
    data: { status: "INSPECTION_DONE" },
  });

  return Response.json({ data: inspection });
});
